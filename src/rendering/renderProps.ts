/**
 * Re-export facade for all Destructible Girders, Solid Props, and Gradient Caches.
 * Preserves 100% backward compatibility across the entire project.
 */

export {
  getPixelHash,
  getMushroomStemGrad,
  getMushroomCapGrad,
  getTreeTrunkGrad,
  getBunkerGrad,
  getTotemGrad,
  getCactusGrad,
  getCrystalGrad,
  getDrumGrad,
  getLampGlowGrad,
  createPath,
  addCircle,
  addEllipse,
} from './props/propGradients';

export { renderHDDestructibleGirder } from './props/renderGirder';

export {
  drawTreeProp,
  drawMushroomProp,
  drawFlowerProp,
  drawCactusProp,
} from './props/renderVegetationProps';

export {
  drawBunkerProp,
  drawTotemProp,
  drawOilDrumProp,
  drawCrystalProp,
  drawLamppostProp,
} from './props/renderStructuralAndMineralProps';

export {
  drawHedgehogProp,
  drawChickProp,
} from './props/renderCritterProps';

export {
  drawSolidPropVector,
  renderHDDestructibleProp,
} from './props/renderDestructibleProp';
