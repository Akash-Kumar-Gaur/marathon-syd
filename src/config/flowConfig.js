// Flow configuration for independent deployment
const FLOW_TYPES = {
  DEFAULT: "default",
  BIB_ROUTE: "bib_route",
};

// Get the current flow type from environment variable
// Defaults to 'default' flow if not specified
const getCurrentFlow = () => {
  const envFlow = process.env.REACT_APP_FLOW_TYPE;
  return envFlow && Object.values(FLOW_TYPES).includes(envFlow)
    ? envFlow
    : FLOW_TYPES.DEFAULT;
};

// Flow configuration object
const FLOW_CONFIG = {
  [FLOW_TYPES.DEFAULT]: {
    afterSplashRoute: "/welcome",
    enabledRoutes: ["/", "/welcome", "/hunt", "/home", "/photobooth"],
  },
  [FLOW_TYPES.BIB_ROUTE]: {
    afterSplashRoute: "/find-my-route",
    enabledRoutes: ["/", "/find-my-route", "/wayfinder"],
  },
};

// Get configuration for current flow
export const getFlowConfig = () => {
  const currentFlow = getCurrentFlow();
  return {
    type: currentFlow,
    ...FLOW_CONFIG[currentFlow],
  };
};

// Helper functions
export const isDefaultFlow = () => getCurrentFlow() === FLOW_TYPES.DEFAULT;
export const isBibRouteFlow = () => getCurrentFlow() === FLOW_TYPES.BIB_ROUTE;
export const getAfterSplashRoute = () => getFlowConfig().afterSplashRoute;
export const isRouteEnabled = (route) =>
  getFlowConfig().enabledRoutes.includes(route);

export { FLOW_TYPES };
