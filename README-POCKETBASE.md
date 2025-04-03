# PocketBase Integration for Screenshot Storage

## Overview

This application now supports storing screenshots in a PocketBase database rather than the filesystem to improve reliability and avoid rendering issues in production.

## Setup Instructions

### 1. Install PocketBase

1. Download PocketBase from [pocketbase.io](https://pocketbase.io/docs/)
2. Extract the PocketBase executable to a directory of your choice

### 2. Configure PocketBase

1. Run PocketBase:
   ```
   ./pocketbase serve
   ```

2. Access the admin UI at `http://localhost:8090/_/` and create an admin account

3. Create a new collection called `screenshots` with the following fields:
   - `id`: Auto-generated (default)
   - `timestamp`: Date/Time field (required)
   - `onlineDevices`: Number field (required)
   - `screenshots`: File field (required)
   - `created`: Date/Time field (default)
   - `updated`: Date/Time field (default)

4. Set the following access rules for the collection:
   - List/Search Rule: Everyone
   - View Rule: Everyone
   - Create Rule: Everyone
   - Update Rule: Super users only
   - Delete Rule: Super users only

### 3. Migrate Existing Screenshots

If you have existing screenshots stored in the filesystem, you can migrate them to PocketBase by accessing:

```
http://localhost:3000/api/migrate-screenshots
```

This will transfer all existing screenshots from the `public/screenshots` directory to the PocketBase database.

## Application Behavior

- The application will attempt to use PocketBase for storing and retrieving screenshots
- If PocketBase is unavailable, it will automatically fall back to the filesystem
- All new screenshots will be stored in both locations if possible (PocketBase and filesystem)
- The application maintains backward compatibility with the old filesystem-based approach

## Troubleshooting

- If screenshots don't appear, ensure PocketBase is running on `http://localhost:8090`
- Check the browser console and server logs for any errors
- Make sure the collection structure in PocketBase matches the expected fields
- Verify that the access rules are set correctly to allow reading and writing records 