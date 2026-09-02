import { createPath } from './slugGradients';

/**
 * 1. Cowl Bounding Shape
 * Perfectly encompasses the slug's head, eyestalks and base neck.
 */
export const HAT_ARACHNID_COWL = createPath((p) => {
  p.moveTo(-3.5, 1.5);
  p.lineTo(-4.2, -6);
  p.lineTo(-4.0, -14.5);
  p.bezierCurveTo(-3, -20.5, 2, -20.5, 5, -19.5);
  p.bezierCurveTo(9, -19.5, 12.5, -16.5, 12.5, -13);
  p.lineTo(12.2, 1.5);
  p.quadraticCurveTo(4.5, 3.5, -3.5, 1.5);
  p.closePath();
});

/**
 * 2. Classic Radiating Spiderweb Grid
 * Radiates from central brow node (4.5, -11) outward with concentric arched curves.
 */
export const HAT_ARACHNID_WEB_GRID = createPath((p) => {
  // --- Radial Web Spokes ---
  p.moveTo(4.5, -11); p.lineTo(4.5, -20);    // Spoke Up
  p.moveTo(4.5, -11); p.lineTo(0.5, -19.5);  // Spoke Up-Left
  p.moveTo(4.5, -11); p.lineTo(-4.0, -14);   // Spoke Left
  p.moveTo(4.5, -11); p.lineTo(-3.5, -5);    // Spoke Down-Left
  p.moveTo(4.5, -11); p.lineTo(4.5, 2.8);    // Spoke Down
  p.moveTo(4.5, -11); p.lineTo(9.5, 2.5);    // Spoke Down-Right
  p.moveTo(4.5, -11); p.lineTo(12.2, -5);    // Spoke Right
  p.moveTo(4.5, -11); p.lineTo(10.5, -17.5); // Spoke Up-Right

  // --- Concentric Inner Web Ring ---
  p.moveTo(4.5, -14); p.quadraticCurveTo(2.8, -13.5, 2.0, -15.5);
  p.moveTo(2.0, -15.5); p.quadraticCurveTo(-0.5, -13.5, -1.5, -12.5);
  p.moveTo(4.5, -14); p.quadraticCurveTo(6.5, -13.5, 7.8, -14.5);
  p.moveTo(7.8, -14.5); p.quadraticCurveTo(10.0, -13.5, 10.5, -11.0);
  p.moveTo(4.5, -7.5); p.quadraticCurveTo(1.5, -7.8, 0.0, -8.0);
  p.moveTo(4.5, -7.5); p.quadraticCurveTo(7.5, -7.8, 9.0, -7.5);

  // --- Concentric Mid Web Ring ---
  p.moveTo(4.5, -17); p.quadraticCurveTo(2.0, -16.5, 1.0, -18.5);
  p.moveTo(1.0, -18.5); p.quadraticCurveTo(-2.0, -15.5, -3.5, -14.0);
  p.moveTo(4.5, -17); p.quadraticCurveTo(7.5, -16.5, 9.5, -16.5);
  p.moveTo(9.5, -16.5); p.quadraticCurveTo(11.5, -14.0, 12.0, -10.0);
  p.moveTo(4.5, -3.5); p.quadraticCurveTo(0.5, -4.0, -2.0, -5.0);
  p.moveTo(4.5, -3.5); p.quadraticCurveTo(8.5, -4.0, 11.5, -5.0);

  // --- Concentric Outer Web Ring ---
  p.moveTo(4.5, -19.5); p.quadraticCurveTo(1.5, -19.0, -0.5, -18.5);
  p.moveTo(4.5, -19.5); p.quadraticCurveTo(8.0, -19.0, 11.0, -15.5);
  p.moveTo(4.5, 0.5); p.quadraticCurveTo(0.0, 0.0, -3.0, -1.0);
  p.moveTo(4.5, 0.5); p.quadraticCurveTo(9.0, 0.0, 11.8, -1.0);
});

/**
 * 3. Iconic Stylized Angular Eye Frames & Lenses (Left Eye)
 */
export const HAT_ARACHNID_EYE_FRAME_L = createPath((p) => {
  p.moveTo(3.6, -11.8);
  p.lineTo(-1.2, -13.8);
  p.quadraticCurveTo(-2.4, -9.8, -0.8, -7.2);
  p.quadraticCurveTo(2.0, -7.0, 3.4, -8.2);
  p.closePath();
});

export const HAT_ARACHNID_LENS_L = createPath((p) => {
  p.moveTo(3.0, -11.4);
  p.lineTo(-0.6, -13.1);
  p.quadraticCurveTo(-1.6, -9.8, -0.4, -7.7);
  p.quadraticCurveTo(1.8, -7.5, 2.9, -8.6);
  p.closePath();
});

/**
 * 4. Iconic Stylized Angular Eye Frames & Lenses (Right Eye)
 */
export const HAT_ARACHNID_EYE_FRAME_R = createPath((p) => {
  p.moveTo(5.4, -11.2);
  p.lineTo(11.2, -12.8);
  p.quadraticCurveTo(11.8, -8.8, 10.2, -6.6);
  p.quadraticCurveTo(7.2, -6.6, 5.6, -7.8);
  p.closePath();
});

export const HAT_ARACHNID_LENS_R = createPath((p) => {
  p.moveTo(6.0, -10.8);
  p.lineTo(10.6, -12.1);
  p.quadraticCurveTo(11.1, -8.8, 9.7, -7.1);
  p.quadraticCurveTo(7.3, -7.1, 6.2, -8.2);
  p.closePath();
});

/**
 * 5. Iconic Mini Chest Spider Insignia
 */
export const HAT_ARACHNID_CHEST_SPIDER = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(4.5, -0.6, 1.1, 1.7, 0, 0, Math.PI * 2);
    p.ellipse(4.5, -2.4, 0.7, 0.7, 0, 0, Math.PI * 2);
  }
  // Upward Legs
  p.moveTo(4.0, -1.8); p.lineTo(2.0, -3.2); p.lineTo(0.5, -2.2);
  p.moveTo(5.0, -1.8); p.lineTo(7.0, -3.2); p.lineTo(8.5, -2.2);
  p.moveTo(4.0, -1.2); p.lineTo(1.8, -1.8); p.lineTo(0.8, -0.6);
  p.moveTo(5.0, -1.2); p.lineTo(7.2, -1.8); p.lineTo(8.2, -0.6);
  // Downward Legs
  p.moveTo(4.0, -0.2); p.lineTo(2.0, 0.8); p.lineTo(1.2, 2.2);
  p.moveTo(5.0, -0.2); p.lineTo(7.0, 0.8); p.lineTo(7.8, 2.2);
  p.moveTo(4.0, 0.4); p.lineTo(2.8, 1.6); p.lineTo(2.2, 2.8);
  p.moveTo(5.0, 0.4); p.lineTo(6.2, 1.6); p.lineTo(6.8, 2.8);
});

/**
 * 6. Symbiote Menacing Jagged Eyes
 */
export const HAT_SYMBIOTE_EYE_L = createPath((p) => {
  p.moveTo(3.6, -11.5);
  p.bezierCurveTo(1.5, -14.5, -1.0, -15.8, -2.6, -15.5);
  p.bezierCurveTo(-1.8, -12.5, -2.5, -9.5, -1.2, -6.5);
  p.bezierCurveTo(0.8, -5.8, 2.4, -6.5, 3.4, -8.0);
  p.quadraticCurveTo(3.2, -9.8, 3.6, -11.5);
  p.closePath();
});

export const HAT_SYMBIOTE_EYE_R = createPath((p) => {
  p.moveTo(5.4, -11.0);
  p.bezierCurveTo(7.8, -13.8, 10.5, -15.0, 12.4, -14.6);
  p.bezierCurveTo(11.8, -11.8, 12.2, -8.8, 10.8, -6.0);
  p.bezierCurveTo(8.8, -5.4, 7.0, -6.2, 5.8, -7.5);
  p.quadraticCurveTo(5.6, -9.4, 5.4, -11.0);
  p.closePath();
});

/**
 * 7. Symbiote Sprawling Chest Spider Insignia
 */
export const HAT_SYMBIOTE_CHEST_SPIDER = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(4.5, -0.4, 1.4, 2.0, 0, 0, Math.PI * 2);
    p.ellipse(4.5, -2.5, 0.9, 0.9, 0, 0, Math.PI * 2);
  }
  // Sharp sweeping legs
  p.moveTo(3.8, -1.8); p.lineTo(1.2, -3.8); p.lineTo(-0.8, -2.6);
  p.moveTo(5.2, -1.8); p.lineTo(7.8, -3.8); p.lineTo(9.8, -2.6);
  p.moveTo(3.8, -0.8); p.lineTo(1.0, -1.8); p.lineTo(-0.2, 0.2);
  p.moveTo(5.2, -0.8); p.lineTo(8.0, -1.8); p.lineTo(9.2, 0.2);
  p.moveTo(3.8, 0.2); p.lineTo(1.5, 1.2); p.lineTo(0.5, 2.8);
  p.moveTo(5.2, 0.2); p.lineTo(7.5, 1.2); p.lineTo(8.5, 2.8);
  p.moveTo(3.8, 0.8); p.lineTo(2.4, 2.0); p.lineTo(1.8, 3.4);
  p.moveTo(5.2, 0.8); p.lineTo(6.6, 2.0); p.lineTo(7.2, 3.4);
});
