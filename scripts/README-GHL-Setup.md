# GoHighLevel Co-Applicant Custom Fields Setup

This script sets up custom fields and folders in GoHighLevel for the co-applicant custom object `custom_objects.aip_co_applicants`.

## Prerequisites

1. **GoHighLevel Custom Object**: Make sure you have already created the custom object `aip_co_applicants` in your GoHighLevel account.

2. **API Access**: You need:
   - Location ID from your GHL sub-account
   - Valid Access Token with `locations/customFields.write` scope

## Getting Your Credentials

### 1. Location ID
1. Go to your GoHighLevel dashboard
2. Look in the URL: `https://app.gohighlevel.com/v2/preview/[LOCATION_ID]/...`
3. Copy the location ID from the URL

### 2. Access Token
You can use either:
- **OAuth Access Token** (recommended for production)
- **Private Integration Token** (easier for one-time setup)

For a Private Integration Token:
1. Go to Settings → Integrations → Private Integrations
2. Create a new private integration
3. Add the scope: `locations/customFields.write`
4. Copy the generated token

## Usage

### Method 1: Using Environment Variables

```bash
# Set your credentials
export GHL_LOCATION_ID="your_location_id_here"
export GHL_ACCESS_TOKEN="your_access_token_here"

# Run the script
node scripts/setup-ghl-co-applicant-fields.js
```

### Method 2: Inline Variables

```bash
GHL_LOCATION_ID="your_location_id" GHL_ACCESS_TOKEN="your_token" node scripts/setup-ghl-co-applicant-fields.js
```

### Method 3: Using npm script

Add this to your `package.json` scripts section:

```json
{
  "scripts": {
    "setup-ghl-fields": "node scripts/setup-ghl-co-applicant-fields.js"
  }
}
```

Then run:
```bash
GHL_LOCATION_ID="your_id" GHL_ACCESS_TOKEN="your_token" npm run setup-ghl-fields
```

## What Gets Created

### Folders
The script creates 4 organized folders:
- 👤 **Personal Information** - Basic details, nationality, marital status
- 🏠 **Address & Living Situation** - Current/previous addresses, housing status
- 💼 **Employment Details** - Employment status and work information
- 💰 **Financial Information** - Age, participant order, financial data

### Custom Fields
The script creates **24 custom fields** including:

**Personal Information:**
- First Name, Last Name, Date of Birth
- Email Address, Mobile Number, Telephone Number
- Nationality (dropdown), Marital Status (dropdown)
- Relationship to Primary Applicant (dropdown)

**Address & Living Situation:**
- Same Address as Primary (checkbox)
- Current/Previous Addresses with time periods
- Tax Country, Homeowner/Tenant status
- Monthly payments and property values
- Lender/Landlord details

**Employment Details:**
- Employment Status (dropdown)

**Financial Information:**
- Age, Participant Order

## Field Keys

All fields use the format: `custom_object.aip_co_applicants.{field_name}`

Examples:
- `custom_object.aip_co_applicants.first_name`
- `custom_object.aip_co_applicants.email`
- `custom_object.aip_co_applicants.current_address`

## Error Handling

The script will:
- ✅ Stop if folders fail to create (they're required for fields)
- ⚠️ Continue if individual fields fail (logs errors but doesn't stop)
- 📊 Show a summary of what was created

## Troubleshooting

### Common Errors

1. **"Location ID not found"**
   - Check your location ID is correct
   - Make sure you have access to that sub-account

2. **"Insufficient permissions"**
   - Verify your token has `locations/customFields.write` scope
   - Check the token hasn't expired

3. **"Custom object not found"**
   - Make sure you've created the `aip_co_applicants` custom object first
   - Check the object key matches exactly

4. **"Field already exists"**
   - The script will show errors for duplicate fields
   - You can safely ignore these if re-running the script

## Verification

After running the script, verify in GoHighLevel:
1. Go to Settings → Custom Fields
2. Select your location
3. Find "AIP Co Applicants" in the object dropdown
4. You should see all folders and fields organized as expected

## Integration

Once the fields are created, you can use them in:
- GoHighLevel forms and workflows
- API calls to create/update co-applicant records
- Zapier integrations
- Your application's GHL service integration

The field keys can be used directly in API calls to populate co-applicant data from your application form.