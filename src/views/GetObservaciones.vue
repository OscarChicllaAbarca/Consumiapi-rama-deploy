<template>
<div class="table-container">
    <div class="pSuperior">
        <div class="title">
            <h1>Observaciones</h1>
        </div>

        <!-- Contenedor de las columnas -->
        <div class="columns">
            <!-- Filtros y Botón -->
            <div class="column filters-buttons-column">
                <div class="filters">
                    <select v-model="filters.codigo_inventario">
                        <option value="">Todos los códigos</option>
                        <option v-for="codigo in uniqueCodigosInventario" :key="codigo" :value="codigo">
                            {{ codigo }}
                        </option>
                    </select>
                    <!-- ComboBox para Categoría -->
                    <select v-model="filters.categoria">
                        <option value="">Todas las Categorías</option>
                        <option v-for="categoria in uniqueCategorias" :key="categoria" :value="categoria">
                            {{ categoria }}
                        </option>
                    </select>

                    <select v-model="filters.estado">
                        <option value="">Todos los Estados</option>
                        <option v-for="estado in uniqueEstados" :key="estado" :value="estado">
                            {{ estado }}
                        </option>
                    </select>
                    <input v-model="filters.producto" type="text" placeholder="Filtrar por Producto" />
                </div>
                <button @click="exportToExcel" class="btn-export">Exportar a Excel</button>
            </div>

            <!-- Tarjetas Informativas -->
            <div class="column">
                <div class="targetInfo">
                    <div class="targetInfoF faltantes">
                        <h3>Faltantes</h3>
                        <p>{{ countFaltantes }}</p>
                    </div>
                    <div class="targetInfoF sobrantes">
                        <h3>Sobrantes</h3>
                        <p>{{ countSobrantes }}</p>
                    </div>
                    <div class="targetInfoF conciliados">
                        <h3>Conciliados</h3>
                        <p>{{ countConciliados }}</p>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <br />
    <div class="cards-container">
        <div class="card" v-for="observacion in paginatedObservaciones" :key="observacion.id_observacion">
            <div class="card-header">
                <h3>{{ observacion.producto }}</h3>
                <span class="card-category">{{ observacion.categoria_obsv }}</span>
            </div>
            <div class="card-body">
                <p><strong>Estado:
                        <span :class="{
                  'estado-faltante': observacion.estado_pro === 'Faltante',
                  'estado-sobrante': observacion.estado_pro === 'Sobrante',
                  'estado-conciliado': observacion.estado_pro === 'Conciliado'
                }"> {{ observacion.estado_pro }}
                        </span></strong>
                </p>
                <p><strong>Descripción:</strong> {{ observacion.descripcion_pro }}</p>
                <p><strong>Centro:</strong> {{ observacion.centropro }}</p>
                <p><strong>Lote:</strong> {{ observacion.lote_pro }}</p>
                <p><strong>Unidad de Medida:</strong> {{ observacion.unidad_medida_pro }}</p>
                <p><strong>Código de Inventario:</strong> {{ observacion.codigo_inventario_pro }}</p>
                <p><strong>Diferencia:</strong> {{ observacion.diferencia_pro }}</p>
                <p><strong>Categoría:</strong> {{ observacion.categoria_obsv }}</p>
                <p><strong>Observación:</strong> {{ observacion.observacion_obsv }}</p>
            </div>
            <div class="card-footer">
                <button @click="startEdit(observacion)" class="btn-edit">Modificar</button>
                <button @click="deleteObservacion(observacion.id_observacion)" class="btn-delete">Eliminar</button>
            </div>
        </div>
    </div>

    <!-- Paginación -->
    <div class="pagination">
        <button @click="goToFirstPage" :disabled="currentPage === 1">⏮ Primera</button>
        <button @click="prevPage" :disabled="currentPage === 1">❮ Anterior</button>
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">Siguiente ❯</button>
        <button @click="goToLastPage" :disabled="currentPage === totalPages">Última ⏭</button>
    </div>
    <br>

    <!-- Tabla de edición -->
    <div v-if="editingId" class="edit-container">
        <table class="edit-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Estado</th>
                    <th>Descripción</th>
                    <th>Centro</th>
                    <th>Lote</th>
                    <th>Unidad de Medida</th>
                    <th>Código de Inventario</th>
                    <th>Diferencia</th>
                    <th>Categoría</th>
                    <th>Observación</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><input v-model="editedObservacion.producto" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.estado_pro" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.descripcion_pro" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.centropro" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.lote_pro" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.unidad_medida_pro" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.codigo_inventario_pro" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.diferencia_pro" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.categoria_obsv" type="text" class="edit-input"></td>
                    <td><input v-model="editedObservacion.observacion_obsv" type="text" class="edit-input"></td>
                    <td>
                        <button @click="saveObservacion" class="btn-save">Guardar</button>
                        <button @click="cancelEdit" class="btn-cancel">Cancelar</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
</template>

<script>
import axios from 'axios';
import config from '../config';
import * as XLSX from 'xlsx';
export default {
    name: 'GetObservaciones',
    data() {
        return {
            observaciones: [],
            editingId: null,
            editedObservacion: {},
            originalObservacion: {},
            filters: {
                codigo_inventario: '',
                producto: '',
            },
            currentPage: 1,
            itemsPerPage: 5,
        };
    },
    created() {
        this.fetchObservaciones().then(() => {
            this.filters.categoria = ''; // Establecer la categoría en "Todas las Categorías"
            this.filters.estado = ''; // Establecer el estado en "Todos los Estados"
        });
    },

    computed: {

        uniqueCodigosInventario() {
            const codigos = this.observaciones.map((obs) => obs.codigo_inventario_pro);
            return [...new Set(codigos)];
        },

        uniqueCategorias() {
            return [...new Set(this.observaciones.map(obs => obs.categoria_obsv))];
        },

        uniqueEstados() {
            return [...new Set(this.observaciones.map(obs => obs.estado_pro))];
        },

        // Filtrar observaciones según los filtros aplicados
        filteredObservaciones() {
            return this.observaciones.filter(observacion => {
                return (
                    (this.filters.codigo_inventario === '' || observacion.codigo_inventario_pro === this.filters.codigo_inventario) &&
                    observacion.producto.toLowerCase().includes(this.filters.producto.toLowerCase()) &&
                    (this.filters.categoria === '' || observacion.categoria_obsv === this.filters.categoria) &&
                    (this.filters.estado === '' || observacion.estado_pro === this.filters.estado) // Agregado filtro de estado
                );
            });
        },

        // Actualizar la cantidad de cada estado en tiempo real según los filtros
        countFaltantes() {
            return this.filteredObservaciones.filter(obs => obs.estado_pro === 'Faltante').length;
        },
        countSobrantes() {
            return this.filteredObservaciones.filter(obs => obs.estado_pro === 'Sobrante').length;
        },
        countConciliados() {
            return this.filteredObservaciones.filter(obs => obs.estado_pro === 'Conciliado').length;
        },
        paginatedObservaciones() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            return this.filteredObservaciones.slice(start, start + this.itemsPerPage);
        },

        totalPages() {
            return Math.ceil(this.filteredObservaciones.length / this.itemsPerPage);
        },
        getCountByCategoriaEstado(codigo, categoria, estado) {
            return this.filteredObservaciones.filter(observacion => {
                return observacion.codigo_inventario_pro === codigo &&
                    observacion.categoria_obsv === categoria &&
                    observacion.estado_pro === estado;
            }).length;
        }
    },
    methods: {

        exportToExcel() {
            const ws = XLSX.utils.json_to_sheet(this.filteredObservaciones);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Observaciones");
            XLSX.writeFile(wb, "observaciones.xlsx");
        },
        async fetchObservaciones() {
            try {
                

                // Obtener las observaciones
                const response = await axios.get(`${config.BASE_URL}/api/observaciones`, {
                    withCredentials: true // Incluir cookies en la solicitud
                });

                this.observaciones = response.data;
            } catch (error) {
                console.error('Error al obtener las observaciones:', error);
                alert('Hubo un error al obtener las observaciones');
            }
        },

        startEdit(observacion) {
            this.editingId = observacion.id_observacion;
            this.editedObservacion = {
                ...observacion
            };
            this.originalObservacion = {
                ...observacion
            };
        },

        async saveObservacion() {
            try {
                const response = 
                    axios.put(`${config.BASE_URL}/api/observaciones/${this.editingId}`, this.editedObservacion, {
                        headers: {
                            "Content-Type": "application/json"
                        },
                        withCredentials: true,
                    }
                );

                const index = this.observaciones.findIndex(o => o.id_observacion === this.editingId);
                this.observaciones.splice(index, 1, response.data);

                this.editingId = null;
                alert("Observación actualizada correctamente");
            } catch (error) {
                console.error("Error al actualizar:", error);
                alert("Error al actualizar la observación");
            }
        },

        cancelEdit() {
            const index = this.observaciones.findIndex(o => o.id_observacion === this.editingId);
            this.observaciones.splice(index, 1, this.originalObservacion);
            this.editingId = null;
        },

        async deleteObservacion(id) {
            if (confirm("¿Estás seguro de que quieres eliminar esta observación?")) {
                try {
                    await axios.delete(`${config.BASE_URL}/api/observaciones/${id}`, {
                        withCredentials: true // 🔹 Enviar cookies automáticamente
                    });

                    this.observaciones = this.observaciones.filter(obs => obs.id_observacion !== id);
                    alert("Observación eliminada correctamente");
                } catch (error) {
                    console.error("Error al eliminar la observación:", error);
                    alert("Error al eliminar la observación");
                }
            }
        },

        goToFirstPage() {
            this.currentPage = 1;
        },
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },
        goToLastPage() {
            this.currentPage = this.totalPages;
        }
    },
};
</script>

<style scoped>
/**Parte Superior */
.pSuperior {
    display: flex;
    flex-direction: column;
    padding: 20px;
    background-color: #0c534c;
    /* Color de fondo suave */
    color: #ffffff;
    /* Color de texto oscuro */
    border-radius: 8px;
    /* Bordes redondeados para un look más suave */
}

.columns {
    display: flex;
    justify-content: space-between;
    /* Espaciado controlado entre las columnas */
    gap: 15px;
    /* Menos separación entre las columnas */
}

.column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    /* Reducción del gap para que no haya tanto espacio */
}

.filters-buttons-column {
    max-width: 400px;
    /* Define un ancho adecuado para filtros y botón */
}

.filters {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

input {
    padding: 12px 15px;
    /* Mayor padding para más comodidad */
    border: 1px solid #ccc;
    border-radius: 8px;
    /* Bordes más redondeados */
    font-size: 16px;
    /* Aumenta el tamaño de la fuente */
    width: 100%;
    /* Hace que el input ocupe el 100% del contenedor */
    box-sizing: border-box;
    /* Asegura que el padding no afecte el tamaño total */
    transition: border-color 0.3s, box-shadow 0.3s;
    /* Transición suave */
}

input:focus {
    border-color: #25dac7;
    /* Cambia el borde a azul cuando el campo está enfocado */
    box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
    /* Sombra azul para resaltar el campo */
    outline: none;
    /* Elimina el borde por defecto del enfoque */
}

button {
    padding: 12px 20px;
    /* Más padding para un botón más grande */
    background-color: #199b8e;
    color: white;
    font-size: 16px;
    /* Aumenta el tamaño de la fuente */
    border: none;
    border-radius: 8px;
    /* Bordes más redondeados */
    cursor: pointer;
    transition: background-color 0.3s, transform 0.3s;
    /* Transición para el hover */
}

button:hover {
    background-color: #0056b3;
    transform: scale(1.05);
    /* Agranda ligeramente el botón cuando se pasa el ratón */
}

button:active {
    background-color: #004085;
    /* Color aún más oscuro cuando se hace clic */
    transform: scale(0.98);
    /* Efecto de presionar */
}

button:focus {
    outline: none;
    /* Elimina el borde por defecto al estar enfocado */
    box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
    /* Sombra para resaltar el botón cuando se enfoca */
}

.cards-column {
    display: flex;
    flex-direction: row;
    /* Las tarjetas estarán una al lado de la otra */
    justify-content: flex-start;
    /* Alinea las tarjetas al inicio de la fila */
    flex-wrap: wrap;
    /* Permite que las tarjetas se ajusten si no caben en una sola fila */
    width: 100%;
    /* Asegura que ocupe todo el espacio disponible */
    gap: 20px;
    /* Espacio entre las tarjetas */
}

.targetInfoF {
    padding: 40px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    /* Alinea los elementos verticalmente */
    justify-content: flex-start;
    align-items: center;
    width: 250px;
    /* Establece un ancho fijo para cada tarjeta */
    box-sizing: border-box;
    /* Asegura que el padding y border no afecten el tamaño total */
    margin: 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    /* Sombra para dar efecto flotante */
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    /* Animación de elevación */
}

.targetInfoF h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    /* Espacio debajo del título */
    color: #ffffff;

}

.targetInfoF p {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    /* Elimina margen para que se vea ajustado */
    font-size: 60px;
    /* Aumenta el tamaño de la fuente */
}

.targetInfoF:hover {
    transform: translateY(-5px);
    /* Eleva la tarjeta al pasar el ratón */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    /* Aumenta la sombra al hacer hover */
}

.targetInfo {
    display: flex;
    gap: 20px;
    /* Espacio entre los elementos dentro de targetInfo */
    justify-content: flex-start;
    width: 100%;
}

.faltantes {
    background-color: #b31a26;
    /* Color de fondo rojo */
    border-color: #f5c6cb;
    /* Color del borde */
    color: white;
    /* Color del texto blanco */

}

.sobrantes {
    background-color: #8ca306;
    border-color: #bee5eb;
}

.conciliados {
    background-color: #069929;
    border-color: #c3e6cb;
}

.title {
    text-align: center;
    /* Centra el título */
    margin-bottom: 40px;
    /* Añade espacio debajo del título */
}

.title h1 {
    font-size: 36px;
    /* Tamaño grande para el título */
    font-weight: 700;
    /* Establece un peso fuerte para el texto */
    color: #ffffff;
    /* Color oscuro para el texto */
    text-transform: uppercase;
    /* Hace el texto en mayúsculas */
    letter-spacing: 2px;
    /* Espacio entre las letras */
    padding: 10px 20px;
    /* Añade un poco de padding alrededor del título */
    background-color: #ffffff49;
    /* Color de fondo suave */
    border-radius: 8px;
    /* Bordes redondeados */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    /* Sombra sutil para darle profundidad */
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    /* Efectos de transición */
}

/**Parte de la tabla principal */
.cards-container {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    /* Mayor espacio entre las tarjetas */
    justify-content: flex-start;
    /* Alineación a la izquierda */
    padding: 30px;
    background-color: #f0f0f0;
    /* Fondo sutil para el contenedor */
    border-radius: 10px;
    /* Bordes redondeados para el contenedor */
}

.card {
    width: 320px;
    /* Ancho ligeramente mayor para tarjetas más amplias */
    background-color: #fff;
    border-radius: 15px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    /* Sombra más marcada */
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    position: relative;
    /* Necesario para efectos adicionales */
}

.card:hover {
    transform: translateY(-12px);
    /* Mayor elevación al pasar el ratón */
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    /* Sombra más intensa */
    border-color: #68ca8549;
    /* Añadir un borde de color azul al hacer hover */
}

.card-header {
    background-color: #2d3946;
    padding: 15px;
    border-bottom: 6px solid #0056b3;
    /* Borde inferior más definido */
    color: #fff;
    text-align: center;
    /* Centrar el texto */
    border-top-left-radius: 15px;
    /* Bordes redondeados */
    border-top-right-radius: 15px;
}

.estado-faltante {
    color: #b31a26;
    /* Rojo para 'Faltante' */
    font-weight: bold;
    text-transform: uppercase;
}

.estado-sobrante {
    color: #8ca306;
    /* Amarillo para 'Sobrante' */
    font-weight: bold;
    text-transform: uppercase;
}

.estado-conciliado {
    color: #28a745;
    /* Verde para 'Conciliado' */
    font-weight: bold;
    text-transform: uppercase;
}

.card-header h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
}

.card-category {
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    color: #f0f0f0;
    /* Color claro para el subtítulo */
}

.card-body {
    padding: 20px;
    color: #333;
    background-color: #fafafa;
    /* Fondo suave */
    font-size: 15px;
}

.card-body p {
    margin: 10px 0;
    line-height: 1.6;
    /* Mejor separación entre líneas */
}

.card-footer {
    padding: 12px;
    background-color: #f8f9fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid #ddd;
    border-bottom-left-radius: 15px;
    /* Bordes redondeados para el pie */
    border-bottom-right-radius: 15px;
}

.btn-edit,
.btn-delete {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 15px;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-edit {
    background-color: #8b830c;
    color: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-edit:hover {
    background-color: #0c534c;
    transform: scale(1.05);
    /* Efecto de zoom al pasar el ratón */
}

.btn-delete {
    background-color: #dc3545;
    color: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-delete:hover {
    background-color: #c82333;
    transform: scale(1.05);
    /* Efecto de zoom en el botón */
}

.card-footer .btn-edit,
.card-footer .btn-delete {
    padding: 8px 16px;
    font-size: 14px;
}

/**Paginacion */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    gap: 10px;
}

.pagination button {
    background-color: #0c534c;
    color: white;
    border: none;
    padding: 10px 15px;
    font-size: 16px;
    cursor: pointer;
    border-radius: 5px;
    transition: background 0.3s ease, transform 0.2s ease;
}

.pagination button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
    background-color: #138579;
    transform: scale(1.05);
}

.pagination span {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    padding: 5px 10px;
    background-color: #f8f9fa;
    border-radius: 5px;
    border: 1px solid #ccc;
}

/**Tabla para modificar */

/* Contenedor de edición */
.edit-container {
    margin: 20px auto;
    width: 95%;
    overflow-x: auto;
}

/* Estilo de la tabla */
.edit-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #f9f9f9;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Encabezados */
.edit-table th {
    background-color: #2d3946;
    color: white;
    padding: 12px;
    text-align: left;
    border-bottom: 2px solid #ddd;
}

/* Filas */
.edit-table td {
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

/* Campos de entrada */
.edit-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
}

/* Botones */
.btn-save,
.btn-cancel {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.btn-save {
    background-color: #28a745;
    color: white;
    margin-right: 5px;
}

.btn-save:hover {
    background-color: #218838;
}

.btn-cancel {
    background-color: #dc3545;
    color: white;
}

.btn-cancel:hover {
    background-color: #c82333;
}

.filters {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 20px;
}

.filters select,
.filters input {
    padding: 10px 15px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 5px;
    transition: border-color 0.3s ease;
    width: 310px;
    /* Ajusta el tamaño según lo necesites */
}

.filters select:focus,
.filters input:focus {
    outline: none;
    border-color: #4CAF50;
    /* Color de borde al enfocar */
}

.filters input {
    width: 250px;
    /* Asegúrate de que tenga el tamaño adecuado */
}

.filters select {
    background-color: #f9f9f9;
    cursor: pointer;
}

.filters select:hover {
    border-color: #007BFF;
    /* Color del borde cuando se pasa el mouse */
}

.filters option {
    padding: 10px;
    background-color: white;
}
</style>
