import {
    CloudPricingDataSource,
    CloudPricingRequest,
    CloudServiceCost
} from '../entities/Analysis';

export interface CloudPricingAdapterResponse {
  services: CloudServiceCost[];
  dataSource: CloudPricingDataSource;
  assumptions: string[];
}

export interface ICloudPricingAdapter {
  estimate(request: CloudPricingRequest): Promise<CloudPricingAdapterResponse>;
}





