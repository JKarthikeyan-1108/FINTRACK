/**
 * src/lib/haptics.js
 * Backward-compatible bridge to the Cashew-Grade Haptics Engine in src/utils/haptics.js
 */
import haptics, {
  tick,
  selection,
  impactLight,
  impactMedium,
  impactHeavy,
  notificationSuccess,
  notificationWarning,
} from '../utils/haptics';

export function triggerHaptic(type = 'light') {
  switch (type) {
    case 'tick':
      return tick();
    case 'selection':
      return selection();
    case 'medium':
      return impactMedium();
    case 'heavy':
      return impactHeavy();
    case 'success':
      return notificationSuccess();
    case 'warning':
    case 'error':
      return notificationWarning();
    case 'light':
    default:
      return impactLight();
  }
}

export {
  tick,
  selection,
  impactLight,
  impactMedium,
  impactHeavy,
  notificationSuccess,
  notificationWarning,
};

export default haptics;
