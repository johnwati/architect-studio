# ✅ AI Prompt Updated for BRD-Specific Content

## What Changed

The AI prompt has been significantly improved to generate **project-specific** content based on your uploaded BRD, rather than generic placeholder text.

## Key Improvements

### 1. **Strict BRD Usage**
The AI now has explicit instructions to:
- Read and extract ALL details from uploaded BRDs
- NOT create generic or placeholder content
- Cite the BRD for every major point
- State when information needs clarification rather than inventing content

### 2. **No Placeholder Names**
Instead of generic terms like "Project X" or "System Y", it will:
- Use the ACTUAL project name from BRD (e.g., "Mobile Loan Refer Decision")
- Use actual system names (e.g., "Johari", "Newgen", "RLOS", "MLOS")
- Use real actors (e.g., "Pension customers", "Branch Users")

### 3. **Extract Specific Details**
The AI is instructed to pull out:
- Requirement IDs (e.g., "FR_1", "FR_2")
- Error codes (e.g., "JH-400", "JH-401")
- Business rules (e.g., "Unattended tickets discarded after 14 days")
- Integration systems
- Actor names and roles

### 4. **Citation Required**
Every section will reference:
- "According to the BRD..."
- "As per BRD Section X..."
- "As specified in Section Y..."

### 5. **Mobile Loan Refer Example**
The prompt specifically mentions your "Mobile Loan Refer Decision" project and includes example system names to guide the AI:
- Johari (Credit scoring system)
- Newgen (Loan origination system)
- RLOS (Retail Loan Origination System)
- MLOS (Microfinance Loan Origination System)

## Example Output

**Before (Generic)**:
> "The system shall process loan applications through the automated workflow..."

**After (BRD-Specific)**:
> "As per BRD Section 4.1, the Mobile Loan Refer Decision system shall route declined loan requests from Johari to Newgen. According to requirement FR_1, the system must have the capability to refer loan requests from channels (USSD, STK, Equity Web, Equity App) to Newgen for manual appraisal when specific error codes (JH-400, JH-401, JH433, JH434, JH436, JH501, JH507, JH707, JH718, JH-807) are triggered."

## How It Works

1. **Upload BRD**: Your Mobile Loan Refer BRD is uploaded
2. **AI Reads**: Claude reads the entire BRD content
3. **Extracts**: Pulls specific names, systems, requirements, codes
4. **Generates**: Creates SDD content using those specifics
5. **Cites**: References BRD sections throughout

## Testing

Upload your **Mobile Loan Refer Decision BRD** and generate any SDD section. The output should now:
- ✅ Use "Mobile Loan Refer Decision" (not "Project X")
- ✅ Mention "Johari", "Newgen", "RLOS", "MLOS"
- ✅ Reference "FR_1", "FR_2", etc.
- ✅ Include "JH-400", "JH-401", etc.
- ✅ State "14 calendar days" rule
- ✅ Mention specific channels (USSD, STK, Web, App)
- ✅ Reference specific actor types

---

**Your SDD Generator now creates BRD-specific content! 🎯📄**


