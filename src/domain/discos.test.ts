import { describe, expect, it } from 'vitest';
import { calcularCarga, describirLado, usaBarra } from './discos';

const kgs = (total: number) => calcularCarga(total).porLado.map((d) => d.kg);

describe('calcularCarga', () => {
  it('reparte en cada lado lo que sobra de la barra de 20 kg', () => {
    expect(kgs(20)).toEqual([]);
    expect(kgs(40)).toEqual([10]);
    expect(kgs(60)).toEqual([20]);
    expect(kgs(45)).toEqual([10, 2.5]);
    expect(kgs(102.5)).toEqual([25, 15, 1.25]);
  });

  it('avisa si el peso es menor que la barra', () => {
    expect(calcularCarga(15).menorQueBarra).toBe(true);
  });

  it('informa lo que no se puede armar con discos estándar', () => {
    expect(calcularCarga(21).resto).toBe(1);
    expect(calcularCarga(22.5).resto).toBe(0);
  });
});

describe('describirLado', () => {
  it('agrupa discos iguales', () => {
    expect(describirLado(calcularCarga(120).porLado)).toBe('2 de 25 kg');
    expect(describirLado(calcularCarga(45).porLado)).toBe('1 de 10 kg y 1 de 2,5 kg');
    expect(describirLado([])).toBe('nada: solo la barra');
  });
});

describe('usaBarra', () => {
  it('reconoce la barra olímpica pero no la barra fija', () => {
    expect(usaBarra('Barra')).toBe(true);
    expect(usaBarra('Barra y banco')).toBe(true);
    expect(usaBarra('Barra fija')).toBe(false);
    expect(usaBarra('Mancuernas')).toBe(false);
    expect(usaBarra(undefined)).toBe(false);
  });
});
