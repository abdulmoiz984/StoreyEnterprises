/**
 * Barrel of every bundled image. `require` needs a literal, so the dataset
 * refers to images by key through this map rather than by path.
 *
 * Keys keep the web's folder as a prefix (services/urgent.jpg -> servicesUrgent)
 * so names stay unambiguous once the folders are flattened.
 */
export const IMAGES = {
  galleryCooler: require('./gallery-cooler.jpg'),
  galleryEquipment: require('./gallery-equipment.jpg'),
  galleryHandoff: require('./gallery-handoff.jpg'),
  galleryPharmacy: require('./gallery-pharmacy.jpg'),
  galleryProof: require('./gallery-proof.jpg'),
  logo: require('./logo.png'),
  onboardingHandled: require('./onboarding-handled.jpg'),
  onboardingProof: require('./onboarding-proof.jpg'),
  onboardingTrack: require('./onboarding-track.jpg'),
  peopleDriver: require('./people-driver.jpg'),
  servicesEquipment: require('./services-equipment.jpg'),
  servicesPharmacy: require('./services-pharmacy.jpg'),
  servicesScheduled: require('./services-scheduled.jpg'),
  servicesSpecimen: require('./services-specimen.jpg'),
  servicesSupplies: require('./services-supplies.jpg'),
  servicesUrgent: require('./services-urgent.jpg'),
};

export default IMAGES;
