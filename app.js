/* ==========================================================
    CONFIGURACIÓN GENERAL
========================================================== */

const API_URL = "http://localhost:3000";

let productos = [];
let categorias = [];
let movimientos = [];

/* ==========================================================
    INICIO DE LA APP
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    document.getElementById("movimientoFecha").value =
        new Date().toISOString().split("T")[0];

    await cargarDatos();

    inicializarEventos();
});

/* ==========================================================
    CARGA GENERAL
========================================================== */

async function cargarDatos() {

    await Promise.all([
        obtenerCategorias(),
        obtenerProductos(),
        obtenerMovimientos()
    ]);

    actualizarDashboard();

    renderCategorias();
    renderProductos();
    renderMovimientos();

    cargarSelectCategorias();
    cargarSelectProductos();
}

function generarIdNumerico(lista) {

    if (!lista.length)
        return 1;

    return (
        Math.max(
            ...lista.map(item => Number(item.id))
        ) + 1
    );
}

/* ==========================================================
    DASHBOARD
========================================================== */

function actualizarDashboard() {

    document.getElementById("totalProductos").textContent =
        productos.length;

    document.getElementById("totalCategorias").textContent =
        categorias.length;

    const stockTotal = productos.reduce(
        (acum, p) => acum + Number(p.stock),
        0
    );

    document.getElementById("totalStock").textContent =
        stockTotal;
}

/* ==========================================================
    PETICIONES API
========================================================== */

async function obtenerCategorias() {

    const response =
        await axios.get(`${API_URL}/categorias`);

    categorias = response.data;
}

async function obtenerProductos() {

    const response =
        await axios.get(`${API_URL}/productos`);

    productos = response.data;
}

async function obtenerMovimientos() {

    const response =
        await axios.get(`${API_URL}/movimientos`);

    movimientos = response.data;
}

/* ==========================================================
    CATEGORÍAS
========================================================== */

// async function crearCategoria(nombre, descripcion) {

//     await axios.post(`${API_URL}/categorias`, {
//         nombre,
//         descripcion
//     });

//     await cargarDatos();
// }

async function crearCategoria(nombre, descripcion) {

    const nuevoId =
        categorias.length > 0
            ? Math.max(...categorias.map(c => Number(c.id))) + 1
            : 1;

    // await axios.post(`${API_URL}/categorias`, {
    //     id: nuevoId,
    //     nombre,
    //     descripcion
    // });

    await axios.post(`${API_URL}/categorias`, {
    id: generarIdNumerico(categorias),
    nombre,
    descripcion
});

    await cargarDatos();
}

async function eliminarCategoria(id) {

    const productosRelacionados =
        productos.filter(
            p => Number(p.categoriaId) === Number(id)
        );

    if (productosRelacionados.length) {

        if (!confirm(
            "Esta categoría tiene productos asociados. " +
            "¿Eliminar categoría, productos y movimientos relacionados?"
        ))
            return;

        for (const producto of productosRelacionados) {

            const movimientosRelacionados =
                movimientos.filter(
                    m => Number(m.productoId) === Number(producto.id)
                );

            for (const mov of movimientosRelacionados) {

                await axios.delete(
                    `${API_URL}/movimientos/${mov.id}`
                );
            }

            await axios.delete(
                `${API_URL}/productos/${producto.id}`
            );
        }

    } else {

        if (!confirm("¿Eliminar categoría?"))
            return;
    }

    await axios.delete(`${API_URL}/categorias/${id}`);

    await cargarDatos();
}

async function editarCategoria(id, nombre, descripcion) {

    await axios.patch(
        `${API_URL}/categorias/${id}`,
        {
            nombre,
            descripcion
        }
    );

    cerrarModalCategoria();

    await cargarDatos();
}

function renderCategorias() {

    const tbody =
        document.getElementById("tablaCategorias");

    tbody.innerHTML = "";

    categorias.forEach(categoria => {

        tbody.innerHTML += `
        <tr>
            <td>${categoria.id}</td>
            <td>${categoria.nombre}</td>
            <td>${categoria.descripcion}</td>

            <td class="acciones">

                <button
                    class="btn-warning"
                    onclick="abrirModalCategoria(
                        ${categoria.id}
                    )">

                    Editar

                </button>

                <button
                    class="btn-danger"
                    onclick="eliminarCategoria(
                        ${categoria.id}
                    )">

                    Eliminar

                </button>

            </td>
        </tr>
        `;
    });
}

/* ==========================================================
    PRODUCTOS
========================================================== */

// async function crearProducto(datos) {

//     await axios.post(
//         `${API_URL}/productos`,
//         datos
//     );

//     await cargarDatos();
// }

async function crearProducto(datos) {

    const nuevoId =
        productos.length > 0
            ? Math.max(...productos.map(p => Number(p.id))) + 1
            : 1;

    // await axios.post(
    //     `${API_URL}/productos`,
    //     {
    //         id: nuevoId,
    //         ...datos
    //     }
    // );

    await axios.post(`${API_URL}/productos`, {
    id: generarIdNumerico(productos),
    ...datos
});

    await cargarDatos();
}

async function eliminarProducto(id) {

    if (!confirm("¿Eliminar producto?"))
        return;

    const relacionados =
        movimientos.filter(
            m => Number(m.productoId) === Number(id)
        );

    for (const mov of relacionados) {

        await axios.delete(
            `${API_URL}/movimientos/${mov.id}`
        );
    }

    await axios.delete(
        `${API_URL}/productos/${id}`
    );

    await cargarDatos();
}

async function editarProducto(id, datos) {

    await axios.patch(
        `${API_URL}/productos/${id}`,
        datos
    );

    cerrarModalProducto();

    await cargarDatos();
}

function renderProductos(lista = productos) {

    const tbody =
        document.getElementById("tablaProductos");

    tbody.innerHTML = "";

    lista.forEach(producto => {

        const categoria =
            categorias.find(
                c =>
                Number(c.id) ===
                Number(producto.categoriaId)
            );

        let estado = "";
        let clase = "";

        if (producto.stock === 0) {

            estado = "Agotado";
            clase = "estado-agotado";

        } else if (producto.stock <= 10) {

            estado = "Stock Bajo";
            clase = "estado-bajo";

        } else {

            estado = "Disponible";
            clase = "estado-stock";
        }

        tbody.innerHTML += `
        <tr>

            <td>${producto.id}</td>

            <td>${producto.nombre}</td>

            <td>
                $${producto.precio.toLocaleString()}
            </td>

            <td>${producto.stock}</td>

            <td>
                ${categoria?.nombre || "-"}
            </td>

            <td>
                <span class="estado ${clase}">
                    ${estado}
                </span>
            </td>

            <td class="acciones">
                <button
                    class="btn-warning"
                    onclick="abrirModalProducto(
                        ${producto.id}
                    )">
                    Editar
                </button>

                <button
                    class="btn-danger"
                    onclick="eliminarProducto(
                        ${producto.id}
                    )">
                    Eliminar
                </button>
            </td>

        </tr>
        `;
    });
}

/* ==========================================================
    MOVIMIENTOS
========================================================== */

async function crearMovimiento(datos) {

    const producto =
        productos.find(
            p =>
            Number(p.id) ===
            Number(datos.productoId)
        );

    if (!producto)
        return;

    let nuevoStock = producto.stock;

    if (datos.tipo === "entrada")
        nuevoStock += datos.cantidad;
    else
        nuevoStock -= datos.cantidad;

    if (nuevoStock < 0) {

        alert("Stock insuficiente");

        return;
    }

    await axios.post(
        `${API_URL}/movimientos`,
        datos
    );

    await axios.patch(
        `${API_URL}/productos/${producto.id}`,
        {
            stock: nuevoStock
        }
    );

    await cargarDatos();
}

async function eliminarMovimiento(id) {

    const movimiento =
        movimientos.find(
            m => Number(m.id) === Number(id)
        );

    if (!movimiento)
        return;

    const producto =
        productos.find(
            p =>
            Number(p.id) ===
            Number(movimiento.productoId)
        );

    let stockCorregido = producto.stock;

    if (movimiento.tipo === "entrada")
        stockCorregido -= movimiento.cantidad;
    else
        stockCorregido += movimiento.cantidad;

    await axios.patch(
        `${API_URL}/productos/${producto.id}`,
        {
            stock: stockCorregido
        }
    );

    await axios.delete(
        `${API_URL}/movimientos/${id}`
    );

    await cargarDatos();
}

function renderMovimientos() {

    const tbody =
        document.getElementById("tablaMovimientos");

    tbody.innerHTML = "";

    movimientos.forEach(mov => {

        const producto =
            productos.find(
                p =>
                Number(p.id) ===
                Number(mov.productoId)
            );

        tbody.innerHTML += `
        <tr>

            <td>${mov.id}</td>

            <td>
                ${producto?.nombre || "-"}
            </td>

            <td>${mov.tipo}</td>

            <td>${mov.cantidad}</td>

            <td>${mov.fecha}</td>

            <td>

                <button
                    class="btn-danger"
                    onclick="eliminarMovimiento(
                        ${mov.id}
                    )">

                    Eliminar

                </button>

            </td>

        </tr>
        `;
    });
}

/* ==========================================================
    HISTORIAL
========================================================== */

function mostrarHistorial(productoId) {

    const contenedor =
        document.getElementById(
            "historialMovimientos"
        );

    const historial =
        movimientos.filter(
            m =>
            Number(m.productoId) ===
            Number(productoId)
        );

    if (!historial.length) {

        contenedor.innerHTML =
            "<p>No hay movimientos.</p>";

        return;
    }

    contenedor.innerHTML =
        historial.map(m => `
        <div class="historial-item">
            <strong>${m.tipo.toUpperCase()}</strong>
            | Cantidad: ${m.cantidad}
            | Fecha: ${m.fecha}
        </div>
        `).join("");
}

/* ==========================================================
    SELECTS
========================================================== */

function cargarSelectCategorias() {

    const selects = [

        document.getElementById(
            "productoCategoria"
        ),

        document.getElementById(
            "editProductoCategoria"
        ),

        document.getElementById(
            "filtroCategoria"
        )

    ];

    selects.forEach(select => {

        const valorActual = select.value;

        if (select.id !== "filtroCategoria")
            select.innerHTML =
                '<option value="">Seleccione categoría</option>';
        else
            select.innerHTML =
                '<option value="">Todas las categorías</option>';

        categorias.forEach(cat => {

            select.innerHTML += `
            <option value="${cat.id}">
                ${cat.nombre}
            </option>
            `;
        });

        select.value = valorActual;
    });
}

function cargarSelectProductos() {

    const selects = [

        document.getElementById(
            "movimientoProducto"
        ),

        document.getElementById(
            "historialProducto"
        )

    ];

    selects.forEach(select => {

        select.innerHTML =
            '<option value="">Seleccione un producto</option>';

        productos.forEach(producto => {

            select.innerHTML += `
            <option value="${producto.id}">
                ${producto.nombre}
            </option>
            `;
        });
    });
}

/* ==========================================================
    EVENTOS
========================================================== */

function inicializarEventos() {

    document
        .getElementById("formCategoria")
        .addEventListener(
            "submit",
            async e => {

                e.preventDefault();

                await crearCategoria(
                    categoriaNombre.value,
                    categoriaDescripcion.value
                );

                e.target.reset();
            }
        );

    document
        .getElementById("formProducto")
        .addEventListener(
            "submit",
            async e => {

                e.preventDefault();

                await crearProducto({

                    nombre:
                        productoNombre.value,

                    precio:
                        Number(
                            productoPrecio.value
                        ),

                    stock:
                        Number(
                            productoStock.value
                        ),

                    categoriaId:
                        Number(
                            productoCategoria.value
                        )
                });

                e.target.reset();
            }
        );

    document
        .getElementById("formMovimiento")
        .addEventListener(
            "submit",
            async e => {

                e.preventDefault();

                await crearMovimiento({

                    productoId:
                        Number(
                            movimientoProducto.value
                        ),

                    tipo:
                        movimientoTipo.value,

                    cantidad:
                        Number(
                            movimientoCantidad.value
                        ),

                    fecha:
                        movimientoFecha.value
                });

                e.target.reset();
            }
        );

    document
        .getElementById("filtroCategoria")
        .addEventListener(
            "change",
            function () {

                if (!this.value) {

                    renderProductos();

                    return;
                }

                renderProductos(

                    productos.filter(
                        p =>
                        Number(
                            p.categoriaId
                        ) ===
                        Number(this.value)
                    )
                );
            }
        );

    document
        .getElementById(
            "historialProducto"
        )
        .addEventListener(
            "change",
            function () {

                mostrarHistorial(
                    this.value
                );
            }
        );

        document
.getElementById("formEditarMovimiento")
.addEventListener(
    "submit",
    async function(e){

        e.preventDefault();

        await editarMovimiento(

            Number(
                editMovimientoId.value
            ),

            editMovimientoTipo.value,

            Number(
                editMovimientoCantidad.value
            )

        );

    }
);
}

/* ==========================================================
    MODALES
========================================================== */

function abrirModalProducto(id) {

    const producto =
        productos.find(
            p => p.id == id
        );

    editProductoId.value =
        producto.id;

    editProductoNombre.value =
        producto.nombre;

    editProductoPrecio.value =
        producto.precio;

    editProductoCategoria.value =
        producto.categoriaId;

    modalProducto.classList.add("show");
}

function cerrarModalProducto() {
    modalProducto.classList.remove("show");
}

function abrirModalCategoria(id) {

    const categoria =
        categorias.find(
            c => c.id == id
        );

    editCategoriaId.value =
        categoria.id;

    editCategoriaNombre.value =
        categoria.nombre;

    editCategoriaDescripcion.value =
        categoria.descripcion;

    modalCategoria.classList.add("show");
}

function abrirModalMovimiento(id) {

    const movimiento =
        movimientos.find(
            m => Number(m.id) === Number(id)
        );

    if (!movimiento) return;

    editMovimientoId.value =
        movimiento.id;

    editMovimientoTipo.value =
        movimiento.tipo;

    editMovimientoCantidad.value =
        movimiento.cantidad;

    modalMovimiento.classList.add("show");
}

function cerrarModalMovimiento() {

    modalMovimiento.classList.remove("show");
}

function cerrarModalCategoria() {
    modalCategoria.classList.remove("show");
}

document
.getElementById("cerrarModalMovimiento")
.addEventListener(
    "click",
    cerrarModalMovimiento
);

document
.getElementById("cerrarModalProducto")
.addEventListener(
    "click",
    cerrarModalProducto
);

document
.getElementById("cerrarModalCategoria")
.addEventListener(
    "click",
    cerrarModalCategoria
);

async function editarMovimiento(
    movimientoId,
    nuevoTipo,
    nuevaCantidad
) {

    const movimiento =
        movimientos.find(
            m =>
            Number(m.id) ===
            Number(movimientoId)
        );

    if (!movimiento)
        return;

    const producto =
        productos.find(
            p =>
            Number(p.id) ===
            Number(movimiento.productoId)
        );

    if (!producto)
        return;

    let stockActual =
        producto.stock;

    /*
        PASO 1
        Revertimos movimiento viejo
    */

    if (movimiento.tipo === "entrada")
        stockActual -= movimiento.cantidad;
    else
        stockActual += movimiento.cantidad;

    /*
        PASO 2
        Aplicamos movimiento nuevo
    */

    if (nuevoTipo === "entrada")
        stockActual += nuevaCantidad;
    else
        stockActual -= nuevaCantidad;

    /*
        Validación
    */

    if (stockActual < 0) {

        alert(
            "La modificación dejaría el stock negativo."
        );

        return;
    }

    /*
        Actualizar stock
    */

    await axios.patch(
        `${API_URL}/productos/${producto.id}`,
        {
            stock: stockActual
        }
    );

    /*
        Actualizar movimiento
    */

    await axios.patch(
        `${API_URL}/movimientos/${movimientoId}`,
        {
            tipo: nuevoTipo,
            cantidad: nuevaCantidad
        }
    );

    cerrarModalMovimiento();

    await cargarDatos();
}