# Flow-Based Deployment Guide

This application supports multiple independent flows that can be deployed separately.

## Available Flows

### 1. Default Flow (Original)

- **Description**: The original treasure hunt game flow
- **Routes**: Splash → Welcome → Hunt → Home → PhotoBooth
- **Environment**: `REACT_APP_FLOW_TYPE=default`

### 2. BIB Route Flow (New)

- **Description**: Marathon BIB number route finder
- **Routes**: Splash → Find My Route
- **Environment**: `REACT_APP_FLOW_TYPE=bib_route`

## Development

### Running Locally

**Default Flow:**

```bash
npm run start:default
```

**BIB Route Flow:**

```bash
npm run start:bib
```

### Building for Production

**Default Flow:**

```bash
npm run build:default
```

**BIB Route Flow:**

```bash
npm run build:bib
```

## Environment Variables

Set `REACT_APP_FLOW_TYPE` to control which flow is active:

- `default` - Original treasure hunt flow
- `bib_route` - BIB number route finder flow

## Deployment Examples

### Using Environment Files

1. Copy the appropriate environment file:

   ```bash
   cp .env.default .env    # For default flow
   cp .env.bib .env        # For BIB route flow
   ```

2. Build and deploy:
   ```bash
   npm run build
   ```

### Using Environment Variables Directly

**Default Flow:**

```bash
REACT_APP_FLOW_TYPE=default npm run build
```

**BIB Route Flow:**

```bash
REACT_APP_FLOW_TYPE=bib_route npm run build
```

### CI/CD Pipeline Examples

**GitHub Actions:**

```yaml
- name: Build Default Flow
  run: npm run build:default

- name: Build BIB Flow
  run: npm run build:bib
```

**Docker:**

```dockerfile
# Default flow
ENV REACT_APP_FLOW_TYPE=default

# BIB route flow
ENV REACT_APP_FLOW_TYPE=bib_route
```

## Flow Configuration

The flow configuration is managed in `src/config/flowConfig.js`. Each flow defines:

- `afterSplashRoute`: Where to navigate after the splash screen
- `enabledRoutes`: Which routes are available in this flow

## Adding New Flows

1. Add new flow type to `FLOW_TYPES` in `flowConfig.js`
2. Add configuration to `FLOW_CONFIG` object
3. Create corresponding environment file (`.env.{flowname}`)
4. Add npm scripts for the new flow
5. Update this documentation
