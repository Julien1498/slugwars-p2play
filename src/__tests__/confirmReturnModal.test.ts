import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ConfirmReturnModal } from '../components/game/modals/ConfirmReturnModal';

describe('ConfirmReturnModal Component', () => {
  it('returns null when isOpen is false', () => {
    const res = ConfirmReturnModal({
      isOpen: false,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    });
    expect(res).toBeNull();
  });

  it('renders confirmation dialog structure when isOpen is true', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    const element = ConfirmReturnModal({
      isOpen: true,
      onClose,
      onConfirm,
    });

    expect(element).not.toBeNull();
    expect(React.isValidElement(element)).toBe(true);
  });
});
