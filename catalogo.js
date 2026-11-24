/* Datos del catálogo.
   Las colecciones guardan el id del producto. Las copias antiguas
   {nombre, foto} se vuelven a enlazar para que un renombre ya
   guardado se vea con el nombre actual. */
(function (root) {
  function idDesdeCopia(productos, item) {
    if (!item || typeof item !== 'object') return null;
    const nombre = item.nombre;
    const foto = item.foto || '';
    const exactos = productos.filter(function (p) {
      return p.nombre === nombre && (p.foto || '') === foto;
    });
    if (exactos.length === 1) return exactos[0].id;
    if (foto) {
      const porFoto = productos.filter(function (p) { return (p.foto || '') === foto; });
      if (porFoto.length === 1) return porFoto[0].id;
    }
    if (nombre) {
      const porNombre = productos.filter(function (p) { return p.nombre === nombre; });
      if (porNombre.length === 1) return porNombre[0].id;
    }
    return null;
  }

  function vincularColecciones(db) {
    const productos = db.productos || [];
    let cambio = false;
    (db.colecciones || []).forEach(function (c) {
      if (!Array.isArray(c.items)) return;
      c.items = c.items.map(function (item) {
        if (!item || typeof item !== 'object') return item;
        if (item.productoId != null) {
          const p = productos.find(function (x) { return x.id == item.productoId; });
          if (!p) return item;
          const extra = Object.keys(item).some(function (k) { return k !== 'productoId'; });
          if (extra) {
            cambio = true;
            return { productoId: p.id };
          }
          return item;
        }
        const id = idDesdeCopia(productos, item);
        if (id == null) return item;
        cambio = true;
        return { productoId: id };
      });
    });
    return cambio;
  }

  function vistaItem(productos, item) {
    if (!item || typeof item !== 'object') return null;
    if (item.productoId != null) {
      const p = (productos || []).find(function (x) { return x.id == item.productoId; });
      if (!p) return null;
      return { nombre: p.nombre, foto: p.foto || '' };
    }
    if (item.nombre) return { nombre: item.nombre, foto: item.foto || '' };
    return null;
  }

  const api = { idDesdeCopia: idDesdeCopia, vincularColecciones: vincularColecciones, vistaItem: vistaItem };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Catalogo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
