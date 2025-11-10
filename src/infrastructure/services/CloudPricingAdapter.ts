import {
    CloudPricePoint,
    CloudPricingDataSource,
    CloudPricingRequest,
    CloudProvider,
    CloudServiceCost,
    CloudServiceUsage
} from '../../domain/entities/Analysis';
import { CloudPricingAdapterResponse, ICloudPricingAdapter } from '../../domain/ports/ICloudPricingAdapter';

type PriceFetchResult = {
  pricePoint: CloudPricePoint;
  source: CloudPricingDataSource;
  assumptions: string[];
};

const FALLBACK_PRICE_POINTS: Record<CloudProvider, Record<string, CloudPricePoint>> = {
  AWS: {
    compute: {
      sku: 'aws-compute-t3-medium',
      description: 'AWS EC2 t3.medium On-Demand compute (US East)',
      unit: 'HOURS',
      pricePerUnit: 0.0416,
      currency: 'USD',
      provider: 'AWS',
      region: 'us-east-1',
      service: 'EC2',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    },
    storage: {
      sku: 'aws-s3-standard',
      description: 'AWS S3 Standard storage (US East)',
      unit: 'GB-MONTH',
      pricePerUnit: 0.023,
      currency: 'USD',
      provider: 'AWS',
      region: 'us-east-1',
      service: 'S3',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    },
    database: {
      sku: 'aws-rds-postgres-large',
      description: 'AWS RDS db.m5.large PostgreSQL (On-Demand)',
      unit: 'HOURS',
      pricePerUnit: 0.29,
      currency: 'USD',
      provider: 'AWS',
      region: 'us-east-1',
      service: 'RDS',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    }
  },
  AZURE: {
    compute: {
      sku: 'azure-compute-d2s-v5',
      description: 'Azure D2s v5 VM (Pay-as-you-go)',
      unit: 'HOURS',
      pricePerUnit: 0.096,
      currency: 'USD',
      provider: 'AZURE',
      region: 'eastus',
      service: 'Virtual Machines',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    },
    storage: {
      sku: 'azure-blob-hot',
      description: 'Azure Blob Storage hot tier (LRS)',
      unit: 'GB-MONTH',
      pricePerUnit: 0.0184,
      currency: 'USD',
      provider: 'AZURE',
      region: 'eastus',
      service: 'Blob Storage',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    },
    database: {
      sku: 'azure-sql-dtu',
      description: 'Azure SQL Database Standard S3 (DTU model)',
      unit: 'HOURS',
      pricePerUnit: 0.112,
      currency: 'USD',
      provider: 'AZURE',
      region: 'eastus',
      service: 'SQL Database',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    }
  },
  GCP: {
    compute: {
      sku: 'gcp-compute-e2-standard-2',
      description: 'GCP e2-standard-2 VM (On-Demand)',
      unit: 'HOURS',
      pricePerUnit: 0.067999,
      currency: 'USD',
      provider: 'GCP',
      region: 'us-central1',
      service: 'Compute Engine',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    },
    storage: {
      sku: 'gcp-storage-standard',
      description: 'GCP Cloud Storage standard class',
      unit: 'GB-MONTH',
      pricePerUnit: 0.020,
      currency: 'USD',
      provider: 'GCP',
      region: 'us-central1',
      service: 'Cloud Storage',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    },
    database: {
      sku: 'gcp-sql-postgres',
      description: 'Cloud SQL for PostgreSQL db-custom-2-7680',
      unit: 'HOURS',
      pricePerUnit: 0.26,
      currency: 'USD',
      provider: 'GCP',
      region: 'us-central1',
      service: 'Cloud SQL',
      lastUpdated: new Date('2024-01-01'),
      source: 'STATIC'
    }
  }
};

const SERVICE_KEY_OVERRIDES: Record<string, string> = {
  lambda: 'compute',
  functions: 'compute',
  firestore: 'database',
  bigquery: 'database',
  dynamodb: 'database',
  s3: 'storage',
  blob: 'storage',
  synapse: 'database'
};

export class CloudPricingAdapter implements ICloudPricingAdapter {
  private cache = new Map<string, CloudPricePoint>();

  async estimate(request: CloudPricingRequest): Promise<CloudPricingAdapterResponse> {
    const services: CloudServiceCost[] = [];
    const assumptions = new Set<string>();
    let highestSource: CloudPricingDataSource = 'STATIC';

    for (const usage of request.usage) {
      try {
        const result = await this.fetchPricePoint(usage);
        highestSource = this.determineDominantSource(highestSource, result.source);
        result.assumptions.forEach(assumption => assumptions.add(assumption));
        services.push(this.calculateServiceCost(usage, result.pricePoint));
      } catch (error) {
        assumptions.add(`Falling back to heuristic pricing for ${usage.service} (${usage.provider}).`);
        const fallback = this.getFallbackPricePoint(usage);
        services.push(this.calculateServiceCost(usage, fallback));
        highestSource = this.determineDominantSource(highestSource, 'STATIC');
      }
    }

    return {
      services,
      dataSource: highestSource,
      assumptions: Array.from(assumptions)
    };
  }

  private async fetchPricePoint(usage: CloudServiceUsage): Promise<PriceFetchResult> {
    const cacheKey = `${usage.provider}:${usage.region}:${usage.service}`.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return {
        pricePoint: this.cache.get(cacheKey)!,
        source: 'CACHED',
        assumptions: []
      };
    }

    const apiResult = await this.fetchFromProviderApi(usage);
    this.cache.set(cacheKey, apiResult.pricePoint);
    return apiResult;
  }

  private async fetchFromProviderApi(usage: CloudServiceUsage): Promise<PriceFetchResult> {
    switch (usage.provider) {
      case 'AWS':
        return this.fetchAwsPricing(usage);
      case 'AZURE':
        return this.fetchAzurePricing(usage);
      case 'GCP':
        return this.fetchGcpPricing(usage);
      default:
        return {
          pricePoint: this.getFallbackPricePoint(usage),
          source: 'STATIC',
          assumptions: ['Unknown provider fallback.']
        };
    }
  }

  private async fetchAwsPricing(usage: CloudServiceUsage): Promise<PriceFetchResult> {
    const normalizedService = this.normalizeServiceKey(usage.service);
    const regionLabel = this.mapAwsRegion(usage.region);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`https://calculator.aws/pricing/2.0/mpp/offers/ec2/current/region/${encodeURIComponent(regionLabel)}.json`, {
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`AWS pricing API responded with ${response.status}`);
      }

      const data = await response.json();
      const products = data?.products ?? {};
      const firstProductKey = Object.keys(products).find(key => key.toLowerCase().includes(normalizedService));

      if (!firstProductKey) {
        throw new Error('No matching AWS pricing product found');
      }

      const product = products[firstProductKey];
      const pricePerUnit = Number(product?.price?.USD) || this.getFallbackPricePoint(usage).pricePerUnit;

      const pricePoint: CloudPricePoint = {
        sku: firstProductKey,
        description: product?.attributes?.instanceType || product?.sku || usage.service,
        unit: product?.unit || usage.unit || 'HOURS',
        pricePerUnit,
        currency: 'USD',
        provider: 'AWS',
        region: usage.region,
        service: usage.service,
        lastUpdated: new Date(),
        source: 'LIVE_API'
      };

      return {
        pricePoint,
        source: 'LIVE_API',
        assumptions: ['AWS pricing retrieved from calculator.aws live endpoint.']
      };
    } catch (error) {
      clearTimeout(timeout);
      return {
        pricePoint: this.getFallbackPricePoint(usage),
        source: 'STATIC',
        assumptions: [`AWS pricing API unavailable (${(error as Error).message}). Fallback rates applied.`]
      };
    }
  }

  private async fetchAzurePricing(usage: CloudServiceUsage): Promise<PriceFetchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`https://azure.microsoft.com/api/v3/pricing/virtual-machines-base/calculator?region=${encodeURIComponent(usage.region)}`, {
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Azure pricing API responded with ${response.status}`);
      }

      const data = await response.json();
      const items = data?.Offers ?? data?.items ?? [];
      const normalizedService = this.normalizeServiceKey(usage.service);
      const match = items.find((item: any) =>
        String(item?.name || '').toLowerCase().includes(normalizedService)
      );

      if (!match) {
        throw new Error('No matching Azure pricing item found');
      }

      const pricePerUnit = Number(match?.prices?.USD) || this.getFallbackPricePoint(usage).pricePerUnit;

      const pricePoint: CloudPricePoint = {
        sku: match?.id || match?.name || usage.service,
        description: match?.name || usage.service,
        unit: match?.unit || usage.unit || 'HOURS',
        pricePerUnit,
        currency: 'USD',
        provider: 'AZURE',
        region: usage.region,
        service: usage.service,
        lastUpdated: new Date(),
        source: 'LIVE_API'
      };

      return {
        pricePoint,
        source: 'LIVE_API',
        assumptions: ['Azure pricing retrieved from azure.microsoft.com pricing API.']
      };
    } catch (error) {
      clearTimeout(timeout);
      return {
        pricePoint: this.getFallbackPricePoint(usage),
        source: 'STATIC',
        assumptions: [`Azure pricing API unavailable (${(error as Error).message}). Fallback rates applied.`]
      };
    }
  }

  private async fetchGcpPricing(usage: CloudServiceUsage): Promise<PriceFetchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch('https://cloudpricingcalculator.appspot.com/static/data/pricelist.json', {
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`GCP pricing API responded with ${response.status}`);
      }

      const data = await response.json();
      const normalizedService = this.normalizeServiceKey(usage.service);
      const regionKey = usage.region.replace('-', '');
      const prices = data?.gcp_price_list || data?.services || {};

      let matchKey: string | undefined;
      Object.keys(prices).some(key => {
        if (key.toLowerCase().includes(normalizedService) && key.toLowerCase().includes(regionKey)) {
          matchKey = key;
          return true;
        }
        return false;
      });

      if (!matchKey) {
        throw new Error('No matching GCP pricing entry found');
      }

      const entry = prices[matchKey];
      const pricePerUnit = Number(entry?.usd_price) || Number(entry?.unitPrice?.USD) || this.getFallbackPricePoint(usage).pricePerUnit;

      const pricePoint: CloudPricePoint = {
        sku: matchKey,
        description: entry?.description || usage.service,
        unit: entry?.unit || usage.unit || 'HOURS',
        pricePerUnit,
        currency: 'USD',
        provider: 'GCP',
        region: usage.region,
        service: usage.service,
        lastUpdated: new Date(),
        source: 'LIVE_API'
      };

      return {
        pricePoint,
        source: 'LIVE_API',
        assumptions: ['GCP pricing retrieved from cloudpricingcalculator dataset.']
      };
    } catch (error) {
      clearTimeout(timeout);
      return {
        pricePoint: this.getFallbackPricePoint(usage),
        source: 'STATIC',
        assumptions: [`GCP pricing API unavailable (${(error as Error).message}). Fallback rates applied.`]
      };
    }
  }

  private calculateServiceCost(usage: CloudServiceUsage, pricePoint: CloudPricePoint): CloudServiceCost {
    const quantity = usage.quantity || 0;
    const baseCost = pricePoint.pricePerUnit * quantity;
    const monthlyCost = baseCost;
    const hourlyCost = pricePoint.unit === 'HOURS' ? pricePoint.pricePerUnit : monthlyCost / (30 * 24);

    return {
      usage,
      pricePoint,
      hourlyCost,
      monthlyCost,
      annualCost: monthlyCost * 12,
      blendedDiscount: 0,
      notes: []
    };
  }

  private determineDominantSource(
    current: CloudPricingDataSource,
    incoming: CloudPricingDataSource
  ): CloudPricingDataSource {
    if (incoming === 'LIVE_API') return 'LIVE_API';
    if (incoming === 'CACHED' && current === 'STATIC') return 'CACHED';
    return current;
  }

  private getFallbackPricePoint(usage: CloudServiceUsage): CloudPricePoint {
    const key = this.normalizeServiceKey(usage.service);
    const overridesKey = SERVICE_KEY_OVERRIDES[usage.service.toLowerCase()] || key;
    const fallback = FALLBACK_PRICE_POINTS[usage.provider]?.[overridesKey] ?? FALLBACK_PRICE_POINTS[usage.provider]?.compute;

    if (!fallback) {
      return {
        sku: `${usage.provider}-${overridesKey}-${usage.region}`,
        description: `${usage.provider} heuristic pricing for ${usage.service}`,
        unit: usage.unit || 'HOURS',
        pricePerUnit: 0.12,
        currency: 'USD',
        provider: usage.provider,
        region: usage.region,
        service: usage.service,
        lastUpdated: new Date(),
        source: 'STATIC'
      };
    }

    return { ...fallback, region: usage.region, service: usage.service };
  }

  private normalizeServiceKey(service: string): string {
    const key = service.toLowerCase().trim();
    if (SERVICE_KEY_OVERRIDES[key]) {
      return SERVICE_KEY_OVERRIDES[key];
    }
    if (key.includes('s3')) return 'storage';
    if (key.includes('storage')) return 'storage';
    if (key.includes('sql') || key.includes('database') || key.includes('db')) return 'database';
    if (key.includes('compute') || key.includes('vm') || key.includes('instance')) return 'compute';
    return 'compute';
  }

  private mapAwsRegion(region: string): string {
    const mapping: Record<string, string> = {
      'us-east-1': 'US East (N. Virginia)',
      'us-east-2': 'US East (Ohio)',
      'us-west-2': 'US West (Oregon)',
      'eu-west-1': 'EU (Ireland)',
      'ap-southeast-1': 'Asia Pacific (Singapore)'
    };
    return mapping[region] || 'US East (N. Virginia)';
  }
}


