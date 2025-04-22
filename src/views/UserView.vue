<template>
<div class="container">
    <h1>Gestión de Empleados</h1>

    <!-- Campo de búsqueda -->
    <div class="search-bar">
        <input v-model="searchQuery" placeholder="Buscar por DNI o Nombre" @input="filterUsers" />
    </div>

    <!-- Tabla para mostrar los usuarios -->
    <table class="user-table">
        <thead>
            <tr>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Apellido Paterno</th>
                <th>Apellido Materno</th>
                <th>Empresa</th>
                <th>Departamento</th>
                <th>Área</th>
                <th>Sucursal</th>
                <th>Puesto</th>
                <th>Estado</th>
                <th>Fecha de Registro</th>
                <th>Correo</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            <!-- Mostrar usuarios filtrados -->
            <tr v-for="user in paginatedUsers" :key="user.dni">
                <!-- DNI -->
                <td v-if="!user.isEditing">{{ user.dni }}</td>
                <td v-else>
                    <input v-model="user.dni" type="number" />
                </td>

                <!-- Nombre -->
                <td v-if="!user.isEditing">{{ user.nombre }}</td>
                <td v-else>
                    <input v-model="user.nombre" />
                </td>

                <!-- Apellido Paterno -->
                <td v-if="!user.isEditing">{{ user.apellidoPaterno }}</td>
                <td v-else>
                    <input v-model="user.apellidoPaterno" />
                </td>

                <!-- Apellido Materno -->
                <td v-if="!user.isEditing">{{ user.apellidoMaterno }}</td>
                <td v-else>
                    <input v-model="user.apellidoMaterno" />
                </td>

                <!-- Empresa -->
                <td v-if="!user.isEditing">{{ user.empresa }}</td>
                <td v-else>
                    <input v-model="user.empresa" />
                </td>

                <!-- Departamento -->
                <td v-if="!user.isEditing">{{ user.departamento }}</td>
                <td v-else>
                    <input v-model="user.departamento" />
                </td>

                <!-- Área -->
                <td v-if="!user.isEditing">{{ user.area }}</td>
                <td v-else>
                    <input v-model="user.area" />
                </td>

                <!-- Sucursal -->
                <td v-if="!user.isEditing">{{ user.sucursal }}</td>
                <td v-else>
                    <input v-model="user.sucursal" />
                </td>

                <!-- Puesto -->
                <td v-if="!user.isEditing">{{ user.puesto }}</td>
                <td v-else>
                    <input v-model="user.puesto" />
                </td>

                <!-- Estado -->
                <td v-if="!user.isEditing">{{ user.estado }}</td>
                <td v-else>
                    <input v-model="user.estado" />
                </td>

                <!-- Fecha de Registro -->
                <td v-if="!user.isEditing">{{ user.fechaRegistro }}</td>
                <td v-else>
                    <input v-model="user.fechaRegistro" type="datetime-local" />
                </td>

                <!-- Correo -->
                <td v-if="!user.isEditing">{{ user.correo }}</td>
                <td v-else>
                    <input v-model="user.correo" type="email" />
                </td>

                <!-- Acciones -->
                <td>
                    <button v-if="!user.isEditing" @click="enableEdit(user)" class="btn-edit">Editar</button>
                    <button v-else @click="saveEdit(user)" class="btn-save">Guardar</button>

                    <button v-if="!user.isEditing" @click="deleteUser(user.dni)" class="btn-delete">Eliminar</button>
                    <button v-else @click="cancelEdit(user)" class="btn-cancel">Cancelar</button>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Paginación -->
    <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1" class="btn-pagination">Anterior</button>
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-pagination">Siguiente</button>
    </div>

    <!-- Botón para mostrar/ocultar el formulario -->
    <button @click="toggleAddUserForm" class="btn-add">
        {{ isAdding ? 'Cancelar' : 'Agregar Nuevo Empleado' }}
    </button>

    <!-- Formulario para agregar un nuevo usuario -->
    <div v-if="isAdding" class="add-user-form">
        <h2>Agregar Nuevo Empleado</h2>
        <form @submit.prevent="addUser">
            <input v-model="newUser.dni" placeholder="DNI" type="number" required />
            <input v-model="newUser.nombre" placeholder="Nombre" required />
            <input v-model="newUser.apellidoPaterno" placeholder="Apellido Paterno" required />
            <input v-model="newUser.apellidoMaterno" placeholder="Apellido Materno" required />
            <input v-model="newUser.empresa" placeholder="Empresa" required />
            <input v-model="newUser.departamento" placeholder="Departamento" required />
            <input v-model="newUser.area" placeholder="Área" required />
            <input v-model="newUser.sucursal" placeholder="Sucursal" required />
            <input v-model="newUser.puesto" placeholder="Puesto" required />
            <input v-model="newUser.estado" placeholder="Estado" required />
            <input v-model="newUser.fechaRegistro" placeholder="Fecha de Registro" type="datetime-local" required />
            <input v-model="newUser.correo" placeholder="Correo" type="email" required />
            <button type="submit" class="btn-submit">Agregar</button>
        </form>
    </div>
</div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import config from '../config';

export default {
    data() {
        return {
            users: [], // Lista de usuarios
            filteredUsers: [], // Lista de usuarios filtrados
            newUser: {
                dni: null,
                nombre: '',
                apellidoPaterno: '',
                apellidoMaterno: '',
                empresa: '',
                departamento: '',
                area: '',
                sucursal: '',
                puesto: '',
                estado: '',
                fechaRegistro: '',
                correo: '',
            }, // Datos del nuevo usuario
            isAdding: false, // Controla la visibilidad del formulario de agregar usuario
            searchQuery: '', // Consulta de búsqueda
            currentPage: 1, // Página actual
            itemsPerPage: 5, // Número de elementos por página
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        },
        paginatedUsers() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredUsers.slice(start, end);
        },
    },
    created() {
        this.getUsers(); // Obtener usuarios al cargar el componente
    },
    methods: {
        async getUsers() {
            try {
                const response = await axios.get(`${config.BASE_URL}/api/user/Credenciales`, {
                    withCredentials: true, // Incluir cookies HttpOnly
                });

                this.users = response.data.map((user) => ({
                    ...user,
                    isEditing: false,
                }));
                this.filteredUsers = this.users;
            } catch (error) {
                console.error("Error al obtener los usuarios:", error);
                if (error.response && error.response.status === 401) {
                    this.$router.push("/login");
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "No se pudo obtener la lista de usuarios.",
                    });
                }
            }
        },

        async addUser() {
            try {
                await axios.post(`${config.BASE_URL}/api/user`, this.newUser, {
                    withCredentials: true, // Cookies HttpOnly
                });

                Swal.fire({
                    icon: "success",
                    title: "Usuario agregado",
                    text: "El usuario se ha agregado correctamente.",
                });

                this.getUsers();
                this.newUser = {
                    dni: null,
                    nombre: "",
                    apellidoPaterno: "",
                    apellidoMaterno: "",
                    empresa: "",
                    departamento: "",
                    area: "",
                    sucursal: "",
                    puesto: "",
                    estado: "",
                    fechaRegistro: "",
                    correo: "",
                };
                this.isAdding = false;
            } catch (error) {
                console.error("Error al agregar el usuario:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo agregar el usuario. Por favor, inténtalo de nuevo.",
                });
            }
        },

        toggleAddUserForm() {
            this.isAdding = !this.isAdding;
        },
        enableEdit(user) {
            user.isEditing = true;
        },
        async saveEdit(user) {
            try {
                await axios.put(`${config.BASE_URL}/api/user/${user.dni}`, user, {
                    withCredentials: true, // Cookies HttpOnly
                });

                user.isEditing = false;
                Swal.fire({
                    icon: "success",
                    title: "Usuario actualizado",
                    text: "El usuario se ha actualizado correctamente.",
                });
                this.getUsers();
            } catch (error) {
                console.error("Error al actualizar el usuario:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo actualizar el usuario. Por favor, inténtalo de nuevo.",
                });
            }
        },
        cancelEdit(user) {
            user.isEditing = false;
            this.getUsers();
        },
        async deleteUser(dni) {
            try {
                await axios.delete(`${config.BASE_URL}/api/user/${dni}`, {
                    withCredentials: true, // Cookies HttpOnly
                });

                Swal.fire({
                    icon: "success",
                    title: "Usuario eliminado",
                    text: "El usuario se ha eliminado correctamente.",
                });
                this.getUsers();
            } catch (error) {
                console.error("Error al eliminar el usuario:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo eliminar el usuario. Por favor, inténtalo de nuevo.",
                });
            }
        },
        filterUsers() {
            if (this.searchQuery) {
                this.filteredUsers = this.users.filter(user =>
                    user.dni.toString().includes(this.searchQuery) ||
                    user.nombre.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            } else {
                this.filteredUsers = this.users;
            }
            this.currentPage = 1; // Reiniciar la paginación al filtrar
        },
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },
        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },
    },
};
</script>

<style scoped>
/* Estilos generales */
.container {
    padding: 20px;
    background-color: #f0f8ff;
    /* Fondo azul claro */
    min-height: 100vh;
    font-family: 'Arial', sans-serif;
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
}

/* Estilos para la tabla */
.user-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 14px;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
}

.user-table th,
.user-table td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}

.user-table th {
    background-color: #007bff;
    /* Azul */
    color: white;
    font-weight: bold;
}

.user-table tbody tr:hover {
    background-color: #f1f1f1;
    transition: background-color 0.3s ease;
}

/* Estilos para los botones */
button {
    margin-right: 5px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    border: none;
    border-radius: 4px;
    transition: background-color 0.3s ease;
}

.btn-edit {
    background-color: #ffc107;
    /* Amarillo */
    color: #000;
}

.btn-save {
    background-color: #28a745;
    /* Verde */
    color: #fff;
}

.btn-delete {
    background-color: #dc3545;
    /* Rojo */
    color: #fff;
}

.btn-cancel {
    background-color: #6c757d;
    /* Gris */
    color: #fff;
}

.btn-add {
    background-color: #007bff;
    /* Azul */
    color: #fff;
    margin-bottom: 20px;
}

.btn-submit {
    background-color: #28a745;
    /* Verde */
    color: #fff;
}

.btn-pagination {
    background-color: #007bff;
    /* Azul */
    color: #fff;
}

/* Estilos para el campo de búsqueda */
.search-bar {
    margin-bottom: 20px;
    text-align: center;
}

.search-bar input {
    width: 300px;
    padding: 10px;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Estilos para el formulario */
.add-user-form {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.add-user-form input {
    display: block;
    width: 100%;
    margin-bottom: 10px;
    padding: 10px;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.add-user-form button {
    width: 100%;
    padding: 10px;
    font-size: 16px;
}

/* Estilos para la paginación */
.pagination {
    margin-top: 20px;
    text-align: center;
}

.pagination button {
    margin: 0 5px;
}
</style>
