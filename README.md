# OpsFlow — Plataforma de Gestión de Servicios Técnicos en Campo

**OpsFlow** es una aplicación web (SPA) diseñada para centralizar, gestionar y hacer seguimiento en tiempo real de solicitudes y órdenes de trabajo (mantenimientos, reparaciones e instalaciones) para pequeñas empresas de servicios técnicos.

Este proyecto forma parte del trabajo de grado para la titulación en **Ingeniería de Software** (Corporación Universitaria Iberoamericana).

---

## Estado del Proyecto: Prototipo Funcional (Frontend MVP)

Actualmente, el repositorio cuenta con el **prototipo interactivo de frontend**, el cual simula el flujo operacional completo entre los distintos roles del sistema utilizando persistencia de estado local en JavaScript.

---

## Roles y Funcionalidades del Sistema

### 1. Autenticación / Selección de Rol
- Pantalla inicial de inicio de sesión con selector dinámico para probar la plataforma desde cualquiera de las 3 perspectivas.

### 2. Panel del Administrador
- **Dashboard Métrico:** Visualización de solicitudes totales, en proceso y finalizadas.
- **Gestión de Solicitudes:** Tabla completa con historial de servicios.
- **Aprobación / Rechazo:** Permite revisar solicitudes entrantes en estado *En revisión*, asignar un técnico responsable y cambiar su estado a *Aprobada y asignada*, o bien marcarla como *Rechazada* especificando el motivo.

### 3. Portal del Técnico
- **Vista de Campo:** Consulta de órdenes de trabajo asignadas al técnico autenticado.
- **Actualización de Avances:** Permite cambiar el estado del servicio (*En proceso*, *Finalizada*) y registrar notas de diagnóstico de campo.

### 4. Portal del Cliente
- **Crear Solicitud:** Formulario intuitivo para detallar el servicio requerido.
- **Geolocalización:** Integración con mapa interactivo (*Leaflet.js* + *OpenStreetMap*) para marcar la ubicación exacta del servicio.
- **Historial:** Seguimiento en tiempo real del estado de sus solicitudes.

---

## Flujo de Estados de una Solicitud

```text
[Solicitud Recibida] ──> [En Revisión] ┬──> [Aprobada y Asignada] ──> [En Proceso] ──> [Finalizada]
                                        └──> [Rechazada (con motivo)]
