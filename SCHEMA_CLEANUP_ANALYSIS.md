# 🔍 Database Schema Analysis: Duplicate/Unused Columns

**Analysis Date:** October 17, 2025  
**Current Schema:** Migration 013 (Latest)

## 🚨 Issues Found

### 1. **CRITICAL: Inconsistent Foreign Key References**

**Problem:** `rental_properties` table has mixed foreign key references:

```sql
-- Original schema (Migration 001):
CREATE TABLE rental_properties (
  application_id UUID REFERENCES applications(id), -- OLD REFERENCE
  ...
);

-- Migration 008 added:
ALTER TABLE rental_properties ADD COLUMN participant_id UUID;
ALTER TABLE rental_properties ADD CONSTRAINT fk_rental_participant_id 
FOREIGN KEY (participant_id) REFERENCES application_participants(id);
```

**Current Status:** Table has BOTH `application_id` AND `participant_id` columns!

**Services using:** Current service (`saveStep5DataNew`) uses `participant_id` but table still has unused `application_id`

---

### 2. **CRITICAL: Same Issue in Other Tables**

All these tables have **duplicate foreign key columns**:

#### `employment_details`
- ✅ **Used:** `participant_id` (current services)
- ❌ **Unused:** `applicant_id` (legacy, should be removed)

#### `financial_commitments`  
- ✅ **Used:** `participant_id` (current services)
- ❌ **Unused:** `applicant_id` (legacy, should be removed)

#### `additional_assets`
- ✅ **Used:** `application_id` (Step 5 assets are application-level)
- ❌ **Potentially Unused:** `participant_id` (was added but may not be used)

---

### 3. **Children Table Confusion**

Migration 013 renamed and restructured children:
- ✅ **Current:** `person_children` with `person_id` foreign key
- ❌ **Potentially Exists:** Old `applicant_children` table might still exist

---

### 4. **Unused Columns in Core Tables**

#### `applications` table:
- ❌ **Unused:** `draft_data JSONB` - Auto-save feature not implemented
- ❌ **Likely Unused:** `progress_percentage` - Calculated, not stored
- ✅ **Used:** All Step 6 Spanish property fields

#### `application_participants` table:
- ❌ **Rarely Used:** `age INTEGER` - Can be calculated from date_of_birth
- ❌ **Rarely Used:** `time_at_*_address_*` fields - Complex calculation storage
- ✅ **Used:** All core participant data

---

## 🛠️ Recommended Cleanup Actions

### **Priority 1: Fix Foreign Key Inconsistencies**

```sql
-- 1. Remove legacy applicant_id columns (should have been done in Migration 012)
ALTER TABLE employment_details DROP COLUMN IF EXISTS applicant_id;
ALTER TABLE financial_commitments DROP COLUMN IF EXISTS applicant_id;

-- 2. Fix rental_properties to use participant_id consistently
ALTER TABLE rental_properties DROP COLUMN IF EXISTS application_id;

-- 3. Verify additional_assets foreign key usage
-- If it's application-level data, keep application_id
-- If it's participant-level data, use participant_id
```

### **Priority 2: Remove Unused Columns**

```sql
-- Remove unused columns from applications
ALTER TABLE applications DROP COLUMN IF EXISTS draft_data;
ALTER TABLE applications DROP COLUMN IF EXISTS progress_percentage;

-- Consider removing calculated fields
ALTER TABLE application_participants DROP COLUMN IF EXISTS age; -- Can calculate from date_of_birth
```

### **Priority 3: Verify Table Structure**

```sql
-- Check if old tables still exist
DROP TABLE IF EXISTS applicant_children; -- Should be person_children now
DROP TABLE IF EXISTS applicants; -- Should be people + application_participants
DROP TABLE IF EXISTS co_applicants; -- Should be people + application_participants
```

---

## 🔍 How to Verify Current State

Run these queries to check the current database state:

```sql
-- 1. Check for duplicate foreign key columns
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name IN ('applicant_id', 'participant_id', 'application_id')
ORDER BY table_name, column_name;

-- 2. Check which tables still exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Check rental_properties structure specifically
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'rental_properties'
ORDER BY ordinal_position;
```

---

## 🎯 Impact on Current Services

### **Working Correctly:**
- ✅ Step 1-2: Uses `people` + `application_participants` 
- ✅ Step 3-4: Uses `participant_id` in employment/financial tables
- ✅ Step 6: Uses `applications` table directly

### **Potentially Broken:**
- ⚠️ **Step 5 (Rental Properties):** Uses `participant_id` but table might have `application_id`
- ⚠️ **Form Loading:** May try to query old table structures

### **Needs Verification:**
- 🔍 Check if `saveStep5DataNew` is actually working in production
- 🔍 Verify `loadApplicationDataNew` query structure
- 🔍 Test rental properties save/load functionality

---

## 🚀 Next Steps

1. **Immediate:** Run verification queries to assess current state
2. **Priority:** Create cleanup migration to remove duplicate columns
3. **Testing:** Verify all Step 1-6 functionality after cleanup
4. **Documentation:** Update schema documentation to reflect clean state

The database has evolved through multiple migrations, and cleanup is needed to remove legacy columns and ensure consistency! 🧹