import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormaLogo } from '../FormaLogo';

describe('FormaLogo Component - Isotipo y Wordmark Oficial FORMA', () => {
  it('renderiza por defecto la variante horizontal con tamaño md y tema dark', () => {
    const { container } = render(<FormaLogo />);
    const logoWrapper = screen.getByTestId('forma-logo-horizontal');
    expect(logoWrapper).toBeInTheDocument();
    expect(screen.getByText('FORMA')).toBeInTheDocument();
    expect(screen.getByText('ATELIER & ALTA COSTURA')).toBeInTheDocument();

    // Comprueba que el SVG está presente
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
  });

  it('renderiza la variante "full" con el subtítulo completo "COLOMBIA • ATELIER & ALTA COSTURA"', () => {
    render(<FormaLogo variant="full" size="lg" theme="dark" />);
    const logoWrapper = screen.getByTestId('forma-logo-full');
    expect(logoWrapper).toBeInTheDocument();
    expect(screen.getByText('COLOMBIA • ATELIER & ALTA COSTURA')).toBeInTheDocument();
  });

  it('renderiza la variante "icon" conteniendo únicamente el monograma SVG', () => {
    render(<FormaLogo variant="icon" size="sm" />);
    const logoWrapper = screen.getByTestId('forma-logo-icon');
    expect(logoWrapper).toBeInTheDocument();
    expect(screen.queryByText('FORMA')).not.toBeInTheDocument();
  });

  it('renderiza la variante "badge" con la píldora editorial', () => {
    render(<FormaLogo variant="badge" theme="light" />);
    const logoWrapper = screen.getByTestId('forma-logo-badge');
    expect(logoWrapper).toBeInTheDocument();
    expect(screen.getByText('FORMA')).toBeInTheDocument();
    expect(screen.getByText('ATELIER')).toBeInTheDocument();
  });

  it('soporta tema "monochrome" para impresión térmica de recibo (80 mm)', () => {
    const { container } = render(<FormaLogo variant="full" size="sm" theme="monochrome" />);
    expect(screen.getByTestId('forma-logo-full')).toBeInTheDocument();

    // En monocromático no deben renderizarse degradados dorados ni de seda
    expect(container.querySelector('linearGradient')).toBeNull();
    expect(container.querySelector('filter')).toBeNull();
  });

  it('permite ocultar el subtítulo cuando showSubtitle es false', () => {
    render(<FormaLogo variant="horizontal" showSubtitle={false} />);
    expect(screen.queryByText('ATELIER & ALTA COSTURA')).not.toBeInTheDocument();
    expect(screen.getByText('FORMA')).toBeInTheDocument();
  });

  it('aplica clases CSS personalizadas pasadas por className', () => {
    render(<FormaLogo className="custom-luxury-class" />);
    expect(screen.getByTestId('forma-logo-horizontal')).toHaveClass('custom-luxury-class');
  });
});
