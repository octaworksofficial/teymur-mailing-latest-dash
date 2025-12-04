# CERİLAS Mailing Platform - Test Guide

## Test Environment Setup

### Prerequisites
- Chrome/Firefox browser (latest version)
- Test email accounts for receiving emails
- Sample Excel files for import testing
- Access to platform URL

### Test Data
- Valid login credentials
- Test contact information
- Sample Excel files with contact data
- Test email addresses for campaigns

## Test Execution Instructions

### How to Use the Test Cases File

1. **Import the CSV file** (`CERILAS_Platform_Test_Cases.csv`) into Excel
2. **Use the Status column** to track test progress:
   - `Pending` - Not started
   - `Pass` - Test passed
   - `Fail` - Test failed
   - `Blocked` - Cannot test due to dependency
   - `Skip` - Test skipped (with reason)

3. **Fill out results**:
   - Update Status after each test
   - Use "Tester Notes" for observations
   - Use "Bug Description" for any issues found

### Test Priority Guidelines

- **High Priority**: Core functionality that affects main business operations
- **Medium Priority**: Important features that enhance user experience  
- **Low Priority**: Nice-to-have features and UI improvements

### Test Categories Overview

#### 1. Authentication & Security (TC001-TC004, TC047-TC048)
- Login/logout functionality
- Input validation and security
- Session management

#### 2. Dashboard & Analytics (TC005-TC006, TC032, TC038-TC039)
- Dashboard data display
- Statistics accuracy
- Email tracking functionality

#### 3. Contact Management (TC007-TC016)
- CRUD operations on contacts
- Excel import/export functionality
- Search and pagination

#### 4. Template Management (TC017-TC022)
- Template creation and editing
- Template variables functionality
- Preview capabilities

#### 5. Campaign Management (TC023-TC031)
- Campaign creation (single & sequence)
- Scheduling and status management
- Advanced features (stop on reply, test emails)

#### 6. Company Information (TC033-TC035)
- Company data management
- SMTP configuration

#### 7. System Administration (TC036-TC037)
- Scheduler logs access and filtering

#### 8. User Experience (TC040-TC044)
- Navigation and UI responsiveness
- Error handling and loading states

#### 9. Performance & Integration (TC045-TC050)
- Performance testing
- End-to-end functionality
- Data integrity

## Critical Test Flows

### Flow 1: Complete Campaign Creation and Sending
1. Login (TC001)
2. Import contacts (TC011)
3. Create template (TC018)
4. Create campaign (TC024)
5. Send campaign (TC030)
6. Verify email delivery (TC049)
7. Check analytics (TC032)

### Flow 2: Template Sequence Campaign
1. Create multiple templates (TC018)
2. Create sequence campaign (TC025)
3. Test scheduling (TC030)
4. Verify sequence delivery (TC049)

### Flow 3: Complete Contact Management
1. Add contacts manually (TC008)
2. Import from Excel (TC011)
3. Edit contact details (TC009)
4. Export contacts (TC013)
5. Search functionality (TC014-TC015)

## Bug Reporting Guidelines

When a test fails:
1. Update Status to "Fail"
2. Fill "Bug Description" with:
   - Steps to reproduce
   - Expected vs Actual result
   - Browser and environment info
   - Screenshots if applicable

## Test Environment Reset

After each major test session:
- Clear browser cache and cookies
- Reset test data if needed
- Verify system is in clean state

## Testing Notes

- Test with realistic data volumes
- Verify email delivery in real email clients
- Test cross-browser compatibility when possible
- Document any performance issues
- Pay attention to user experience and usability

## Contact for Issues

For any questions or clarifications during testing:
- Technical Support: deniz@cerilas.com
- Platform Documentation: Check README files in project

## Test Completion Checklist

- [ ] All High Priority tests completed
- [ ] Critical flows tested end-to-end
- [ ] Bug reports documented with details
- [ ] Performance notes recorded
- [ ] Test results summary prepared