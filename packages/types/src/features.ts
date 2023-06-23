const FEATURES_NAMES = {
  PERSISTENS_SESSION: "PERSISTENT_SESSION",
} as const;

const features = {
  [FEATURES_NAMES.PERSISTENS_SESSION]: false,
} as const;

export { FEATURES_NAMES, features };
