const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { vincularColecciones, vistaItem } = require('../catalogo.js');

const FOTO_PA = 'data:image/svg+xml;utf8,pa';
const FOTO_CL = 'data:image/svg+xml;utf8,cl';

function dbRenombradoGuardado() {
  return {
    productos: [
      { id: 1, nombre: 'Polo Arena Renombrado', descripcion: 'Algodón, color arena', foto: FOTO_PA },
      { id: 2, nombre: 'Casaca Lima', descripcion: 'Impermeable ligera', foto: FOTO_CL }
    ],
    colecciones: [
      { id: 11, nombre: 'Verano', items: [{ nombre: 'Polo Arena', foto: FOTO_PA }] },
      { id: 12, nombre: 'Ofertas', items: [
        { nombre: 'Polo Arena', foto: FOTO_PA },
        { nombre: 'Casaca Lima', foto: FOTO_CL }
      ] }
    ]
  };
}

function nombres(db, coleccion) {
  const c = db.colecciones.find(x => x.nombre === coleccion);
  return c.items.map(i => vistaItem(db.productos, i)).filter(Boolean).map(i => i.nombre);
}

test('un renombre ya guardado se muestra con el nombre actual', () => {
  const db = dbRenombradoGuardado();
  assert.equal(vincularColecciones(db), true);
  assert.deepEqual(nombres(db, 'Verano'), ['Polo Arena Renombrado']);
  assert.deepEqual(nombres(db, 'Ofertas'), ['Polo Arena Renombrado', 'Casaca Lima']);
  assert.deepEqual(db.colecciones[0].items, [{ productoId: 1 }]);
  assert.equal(vincularColecciones(db), false);
});

test('despues de enlazar, otro renombre sigue el id', () => {
  const db = dbRenombradoGuardado();
  vincularColecciones(db);
  db.productos[0].nombre = 'Polo Arena V2';
  db.productos[0].foto = 'foto-nueva';
  assert.deepEqual(nombres(db, 'Verano'), ['Polo Arena V2']);
  assert.deepEqual(nombres(db, 'Ofertas'), ['Polo Arena V2', 'Casaca Lima']);
});

test('una copia con el mismo nombre se enlaza y luego refleja el renombre', () => {
  const db = {
    productos: [
      { id: 1, nombre: 'Polo Arena', foto: FOTO_PA },
      { id: 2, nombre: 'Casaca Lima', foto: FOTO_CL }
    ],
    colecciones: [
      { id: 11, nombre: 'Verano', items: [{ nombre: 'Polo Arena', foto: FOTO_PA }] }
    ]
  };
  vincularColecciones(db);
  db.productos[0].nombre = 'Polo Arena Renombrado';
  assert.deepEqual(nombres(db, 'Verano'), ['Polo Arena Renombrado']);
});

test('sin foto, un nombre unico igual se enlaza', () => {
  const db = {
    productos: [{ id: 7, nombre: 'Gorra', foto: '' }],
    colecciones: [{ id: 1, nombre: 'Basicos', items: [{ nombre: 'Gorra', foto: '' }] }]
  };
  assert.equal(vincularColecciones(db), true);
  assert.deepEqual(db.colecciones[0].items, [{ productoId: 7 }]);
});

test('dos productos con la misma foto no se adivinan', () => {
  const db = {
    productos: [
      { id: 1, nombre: 'Uno', foto: FOTO_PA },
      { id: 2, nombre: 'Dos', foto: FOTO_PA }
    ],
    colecciones: [{ id: 1, nombre: 'Mixta', items: [{ nombre: 'Viejo', foto: FOTO_PA }] }]
  };
  assert.equal(vincularColecciones(db), false);
  assert.deepEqual(nombres(db, 'Mixta'), ['Viejo']);
});

test('un producto borrado no se muestra en la coleccion', () => {
  const db = {
    productos: [{ id: 2, nombre: 'Casaca Lima', foto: FOTO_CL }],
    colecciones: [{ id: 1, nombre: 'Ofertas', items: [{ productoId: 1 }, { productoId: 2 }] }]
  };
  assert.deepEqual(nombres(db, 'Ofertas'), ['Casaca Lima']);
});

test('la pagina guarda ids y no una copia del nombre', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /productoId:p\.id/);
  assert.match(html, /productoId:a\.id/);
  assert.doesNotMatch(html, /nombre:p\.nombre,foto:p\.foto/);
  assert.doesNotMatch(html, /nombre:a\.nombre,foto:a\.foto/);
});
