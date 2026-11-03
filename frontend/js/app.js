// Ejecutar cuando el DOM esté completamente cargado y parseado
document.addEventListener('DOMContentLoaded', () => {

  /* ===========================================================================
     SECCIÓN 1: MODELO DE DATOS INICIAL Y ESTADO GLOBAL (STATE MANAGEMENT)
     =========================================================================== */
  const TECHNICIANS_CATALOG = [
    { id: "TECH-01", name: "Juan Pérez", specialty: "Redes & Infraestructura de Fibra Óptica", email: "juan.perez@opsflow.com" },
    { id: "TECH-02", name: "Carlos Gómez", specialty: "Mantenimiento Eléctrico & Climatización", email: "carlos.gomez@opsflow.com" },
    { id: "TECH-03", name: "Lucía Torres", specialty: "Hardware, Servidores & Almacenamiento", email: "lucia.torres@opsflow.com" }
  ];

  const CLIENTS_CATALOG = [
    { id: "CLI-01", name: "Empresa Inversiones Alfa", email: "contacto@inversionesalfa.com", contact: "Gerencia TI" },
    { id: "CLI-02", name: "Restaurante Gourmet La Terraza", email: "gerencia@laterraza.com", contact: "Administración" },
    { id: "CLI-03", name: "Consultorio Médico San José", email: "dr.sanchez@sanjosemed.com", contact: "Recepción Médica" }
  ];

  const INITIAL_SEED_REQUESTS = [
    {
      id: "REQ-1001",
      client: "Empresa Inversiones Alfa",
      clientEmail: "contacto@inversionesalfa.com",
      service: "Instalación de Router Fibra Óptica",
      description: "Se requiere instalación física, configuración de VLANs y balanceo para nueva troncal simétrica de 500 Mbps en sede financiera.",
      address: "Cra. 7 #71-52, Torre Financiera, Chapinero, Bogotá",
      lat: 4.6558,
      lng: -74.0575,
      technician: null,
      scheduledDate: null,
      status: "En revisión",
      date: "2026-10-28 09:30",
      rejectionReason: null,
      notes: "Ticket ingresado por cliente. En espera de revisión por el Administrador para aprobación/asignación o rechazo con motivo."
    },
    {
      id: "REQ-1002",
      client: "Restaurante Gourmet La Terraza",
      clientEmail: "gerencia@laterraza.com",
      service: "Mantenimiento Preventivo de Servidores",
      description: "Revisión física periódica, limpieza de bahías y respaldo de contingencia de bases de datos de punto de venta (POS).",
      address: "Calle 93 #13-45, Chicó Norte, Usaquén, Bogotá",
      lat: 4.6772,
      lng: -74.0490,
      technician: "Juan Pérez",
      scheduledDate: "2026-10-30",
      status: "En proceso",
      date: "2026-10-27 14:15",
      rejectionReason: null,
      notes: "Técnico Juan Pérez en sitio. Se completó limpieza de ventiladores en Rack 2. Iniciando migración de snapshot."
    },
    {
      id: "REQ-1003",
      client: "Consultorio Médico San José",
      clientEmail: "dr.sanchez@sanjosemed.com",
      service: "Reparación de Cableado Estructurado",
      description: "Caída total de conexión Ethernet en área de Rayos X tras sobrecarga eléctrica en el transformador principal.",
      address: "Calle 127 #15-32, Edificio San José, Usaquén, Bogotá",
      lat: 4.7085,
      lng: -74.0410,
      technician: "Carlos Gómez",
      scheduledDate: "2026-10-27",
      status: "Finalizada",
      date: "2026-10-26 11:00",
      rejectionReason: null,
      notes: "Se sustituyeron 45 metros de cable Cat6 blindado y conectores RJ45. Pruebas de velocidad de 1 Gbps completadas exitosamente."
    },
    {
      id: "REQ-1004",
      client: "Empresa Inversiones Alfa",
      clientEmail: "contacto@inversionesalfa.com",
      service: "Soporte de Switch PoE para Cámaras IP",
      description: "Cámaras del circuito cerrado en sótano y parqueadero corporativo no reciben suministro de energía PoE.",
      address: "Av. El Dorado #68C-61, Centro Empresarial Plaza Claro, Bogotá",
      lat: 4.6565,
      lng: -74.1095,
      technician: "Juan Pérez",
      scheduledDate: "2026-10-31",
      status: "Aprobada y asignada",
      date: "2026-10-29 08:45",
      rejectionReason: null,
      notes: "Orden aprobada por el Administrador. Asignada al técnico Juan Pérez con fecha programada para el 2026-10-31."
    },
    {
      id: "REQ-1005",
      client: "Restaurante Gourmet La Terraza",
      clientEmail: "gerencia@laterraza.com",
      service: "Instalación de Subestación de Alta Tensión",
      description: "Montaje y energización de transformador de 13.2 kV para nueva planta eléctrica industrial en patio posterior.",
      address: "Calle 93 #13-45, Chicó Norte, Usaquén, Bogotá",
      lat: 4.6775,
      lng: -74.0495,
      technician: null,
      scheduledDate: null,
      status: "Rechazada",
      date: "2026-10-28 16:30",
      rejectionReason: "Fuera de alcance técnico: La empresa se especializa en baja y media tensión comercial y telecomunicaciones; los trabajos de 13.2 kV deben tramitarse directamente con el operador de red Enel.",
      notes: "Rechazada por la Administración con motivo registrado. Aviso por correo electrónico emitido al cliente vía Resend."
    }
  ];

  const state = {
    currentUser: null,
    requests: [],
    technicians: [...TECHNICIANS_CATALOG],
    clients: [...CLIENTS_CATALOG],
    targetRequestIdForAssign: null,
    targetRequestIdForReject: null,
    leafletMap: null,
    leafletMarker: null,
    activeFilterStatus: "ALL"
  };

  /*Persistencia de datos durante pruebas*/
  function initStorage() {
    const STORAGE_KEY = 'opsflow_requests_store_bogota_v3';
    const TECH_KEY = 'opsflow_technicians_store_v1';
    
    // Cargar técnicos
    const storedTechs = localStorage.getItem(TECH_KEY);
    if (storedTechs) {
      try {
        state.technicians = JSON.parse(storedTechs);
      } catch (e) {
        state.technicians = [...TECHNICIANS_CATALOG];
      }
    } else {
      state.technicians = [...TECHNICIANS_CATALOG];
    }

    // Cargar solicitudes
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        state.requests = JSON.parse(stored);
      } catch (e) {
        console.warn("Error al parsear localStorage, restaurando semillas de Bogotá:", e);
        state.requests = [...INITIAL_SEED_REQUESTS];
      }
    } else {
      // Inicializar con el dataset de Bogotá que incluye el flujo de rechazo
      state.requests = [...INITIAL_SEED_REQUESTS];
      persistRequests();
    }
  }

  /*Serializa la colección actual de solicitudes y técnicos a formato JSON en `localStorage`.*/
  function persistRequests() {
    localStorage.setItem('opsflow_requests_store_bogota_v3', JSON.stringify(state.requests));
    localStorage.setItem('opsflow_technicians_store_v1', JSON.stringify(state.technicians));
  }


  /* ===========================================================================
     SECCIÓN 2: CONTROLADOR DE VISTAS Y NAVEGACIÓN SPA
     =========================================================================== */
  const dom = {
    // Encabezado
    mainHeader: document.getElementById('mainHeader'),
    headerUserAvatar: document.getElementById('headerUserAvatar'),
    headerUserName: document.getElementById('headerUserName'),
    headerUserRole: document.getElementById('headerUserRole'),
    btnLogout: document.getElementById('btnLogout'),

    // Vistas SPA
    viewLogin: document.getElementById('viewLogin'),
    viewAdmin: document.getElementById('viewAdmin'),
    viewTech: document.getElementById('viewTech'),
    viewClient: document.getElementById('viewClient'),

    // Formulario de Login
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginRole: document.getElementById('loginRole'),

    // Vista Administrador
    kpiTotalRequests: document.getElementById('kpiTotalRequests'),
    kpiInProgressRequests: document.getElementById('kpiInProgressRequests'),
    kpiCompletedRequests: document.getElementById('kpiCompletedRequests'),
    adminRequestsTable: document.getElementById('adminRequestsTable'),
    adminTableBody: document.getElementById('adminTableBody'),
    adminStatusFilter: document.getElementById('adminStatusFilter'),

    // Vista Técnico
    techProfileName: document.getElementById('techProfileName'),
    techOrdersCountBadge: document.getElementById('techOrdersCountBadge'),
    techOrdersContainer: document.getElementById('techOrdersContainer'),

    // Vista Cliente
    newRequestForm: document.getElementById('newRequestForm'),
    reqServiceTitle: document.getElementById('reqServiceTitle'),
    reqDescription: document.getElementById('reqDescription'),
    reqAddress: document.getElementById('reqAddress'),
    reqLatitude: document.getElementById('reqLatitude'),
    reqLongitude: document.getElementById('reqLongitude'),
    mapCoordsBadge: document.getElementById('mapCoordsBadge'),
    clientTableBody: document.getElementById('clientTableBody'),

    // Modal Asignar Técnico (Aprobación y Programación)
    assignModal: document.getElementById('assignModal'),
    modalRequestSummary: document.getElementById('modalRequestSummary'),
    modalPreviewClient: document.getElementById('modalPreviewClient'),
    modalPreviewService: document.getElementById('modalPreviewService'),
    modalPreviewServiceDescription: document.getElementById('modalPreviewServiceDescription'),
    modalPreviewAddress: document.getElementById('modalPreviewAddress'),
    modalTargetRequestId: document.getElementById('modalTargetRequestId'),
    selectTechnician: document.getElementById('selectTechnician'),
    assignScheduledDate: document.getElementById('assignScheduledDate'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    modalConfirmBtn: document.getElementById('modalConfirmBtn'),

    // Modal Rechazar Solicitud (Administrador)
    rejectModal: document.getElementById('rejectModal'),
    modalRejectRequestSummary: document.getElementById('modalRejectRequestSummary'),
    modalRejectPreviewClient: document.getElementById('modalRejectPreviewClient'),
    modalRejectPreviewService: document.getElementById('modalRejectPreviewService'),
    modalRejectTargetRequestId: document.getElementById('modalRejectTargetRequestId'),
    rejectReasonInput: document.getElementById('rejectReasonInput'),
    modalRejectCloseBtn: document.getElementById('modalRejectCloseBtn'),
    modalRejectCancelBtn: document.getElementById('modalRejectCancelBtn'),
    modalRejectConfirmBtn: document.getElementById('modalRejectConfirmBtn'),

    // Modal Creación de Cuentas (Administrador)
    btnOpenCreateUserModal: document.getElementById('btnOpenCreateUserModal'),
    createUserModal: document.getElementById('createUserModal'),
    createUserForm: document.getElementById('createUserForm'),
    newUserRole: document.getElementById('newUserRole'),
    newUserName: document.getElementById('newUserName'),
    newUserEmail: document.getElementById('newUserEmail'),
    newUserDetail: document.getElementById('newUserDetail'),
    lblUserDetail: document.getElementById('lblUserDetail'),
    modalCreateUserCloseBtn: document.getElementById('modalCreateUserCloseBtn'),
    modalCreateUserCancelBtn: document.getElementById('modalCreateUserCancelBtn'),

    // Búsqueda en Mapa (Nominatim)
    mapSearchInput: document.getElementById('mapSearchInput'),
    btnSearchLocation: document.getElementById('btnSearchLocation'),

    // Contenedor Toasts
    toastContainer: document.getElementById('toastContainer')
  };

  function switchView(viewName) {
    const allViews = [dom.viewLogin, dom.viewAdmin, dom.viewTech, dom.viewClient];
    allViews.forEach(view => {
      view.classList.add('view-hidden');
      view.classList.remove('view-active');
    });

    if (viewName === 'login') {
      dom.mainHeader.classList.add('header-hidden');
      dom.viewLogin.classList.remove('view-hidden');
      dom.viewLogin.classList.add('view-active');
      return;
    }

    // Para cualquier vista interna, aseguramos que el header sea visible
    dom.mainHeader.classList.remove('header-hidden');
    updateHeaderUserBadge();

    switch (viewName) {
      case 'admin':
        dom.viewAdmin.classList.remove('view-hidden');
        dom.viewAdmin.classList.add('view-active');
        renderAdminDashboard();
        break;

      case 'tech':
        dom.viewTech.classList.remove('view-hidden');
        dom.viewTech.classList.add('view-active');
        renderTechPortal();
        break;

      case 'client':
        dom.viewClient.classList.remove('view-hidden');
        dom.viewClient.classList.add('view-active');
        renderClientPortal();
        // Leaflet necesita recalcular sus dimensiones cuando el contenedor pasa de display:none a visible
        setTimeout(() => {
          initOrRefreshClientMap();
        }, 150);
        break;

      default:
        console.error(`Vista no reconocida: ${viewName}`);
    }
  }

  /* Actualiza el avatar, el nombre legible y la etiqueta del rol activo en la barra de navegación fija superior.*/
  function updateHeaderUserBadge() {
    if (!state.currentUser) return;
    dom.headerUserName.textContent = state.currentUser.name;
    dom.headerUserRole.textContent = `Rol: ${state.currentUser.roleTitle}`;
    dom.headerUserAvatar.textContent = state.currentUser.avatarInitials;
  }


  /* ===========================================================================
     SECCIÓN 3: GESTIÓN DE AUTENTICACIÓN (LOGIN & LOGOUT)
     =========================================================================== */
  dom.loginRole.addEventListener('change', (e) => {
    const role = e.target.value;
    if (role === 'admin') {
      dom.loginEmail.value = 'admin@opsflow.com';
    } else if (role === 'tech') {
      dom.loginEmail.value = 'juan.perez@opsflow.com';
    } else if (role === 'client') {
      dom.loginEmail.value = 'contacto@inversionesalfa.com';
    }
  });

  /**
   *    ¿QUÉ HACE EL EVENT LISTENER loginForm (submit)?
   *    Intercepta el envío del formulario de login, cancela la recarga de página
   *    con `e.preventDefault()`, crea el objeto de sesión para el rol elegido
   *    y conmuta a la vista correspondiente.
   */
  dom.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedRole = dom.loginRole.value;

    if (selectedRole === 'admin') {
      state.currentUser = {
        id: "USR-ADMIN",
        name: "Administrador General",
        email: dom.loginEmail.value || "admin@opsflow.com",
        role: "admin",
        roleTitle: "Administrador",
        avatarInitials: "AD"
      };
      switchView('admin');
      showToast('Bienvenido, Administrador. Panel de control activo.', 'info');
    } else if (selectedRole === 'tech') {
      state.currentUser = {
        id: "TECH-01",
        name: "Juan Pérez",
        email: dom.loginEmail.value || "juan.perez@opsflow.com",
        role: "tech",
        roleTitle: "Técnico de Campo",
        avatarInitials: "JP"
      };
      switchView('tech');
      showToast('Sesión de campo iniciada. Hola, Juan Pérez.', 'info');
    } else if (selectedRole === 'client') {
      state.currentUser = {
        id: "CLI-01",
        name: "Empresa Inversiones Alfa",
        email: dom.loginEmail.value || "contacto@inversionesalfa.com",
        role: "client",
        roleTitle: "Cliente Corporativo",
        avatarInitials: "IA"
      };
      switchView('client');
      showToast('Bienvenido a tu portal de autoservicio de soporte.', 'info');
    }
  });

  /* Boton Logout */
  dom.btnLogout.addEventListener('click', () => {
    state.currentUser = null;
    switchView('login');
    showToast('Sesión cerrada correctamente.', 'info');
  });


  /**
   * ============================================================================
   * NOTIFICACIONES TRANSACCIONALES POR CORREO (SIMULACIÓN RESEND API)
   * ============================================================================
   */
  function simulateResendEmail(recipientEmail, actionType, details = '') {
    const subjects = {
      'Aprobada y asignada': '¡Tu solicitud ha sido aprobada y asignada!',
      'Rechazada': 'Actualización sobre tu solicitud de servicio (Rechazada)',
      'Finalizada': 'Servicio técnico finalizado exitosamente'
    };
    const subject = subjects[actionType] || `Actualización de solicitud: ${actionType}`;
    console.log(`[Resend Email Service] Enviando correo a: ${recipientEmail} | Asunto: "${subject}" | Detalle: ${details}`);
    showToast(`📧 [Resend] Notificación enviada a ${recipientEmail}: ${subject}`, 'info');
  }

  /* ===========================================================================
     SECCIÓN 4: VISTA 2 - PANEL DEL ADMINISTRADOR (DASHBOARD & ASIGNACIÓN)
     =========================================================================== */

  function renderAdminDashboard() {
    // 1. Cálculo reactivo de KPIs
    const totalCount = state.requests.length;
    const inProgressCount = state.requests.filter(r => r.status === 'En proceso').length;
    const completedCount = state.requests.filter(r => r.status === 'Finalizada').length;

    dom.kpiTotalRequests.textContent = totalCount;
    dom.kpiInProgressRequests.textContent = inProgressCount;
    dom.kpiCompletedRequests.textContent = completedCount;

    // 2. Filtrado opcional por estado
    let filteredRequests = state.requests;
    if (state.activeFilterStatus !== 'ALL') {
      filteredRequests = state.requests.filter(r => r.status === state.activeFilterStatus);
    }

    // 3. Renderizado de la tabla
    dom.adminTableBody.innerHTML = '';

    if (filteredRequests.length === 0) {
      dom.adminTableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-title">No hay órdenes para mostrar</div>
              <div class="empty-state-desc">No se encontraron solicitudes con el filtro seleccionado.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    filteredRequests.forEach(req => {
      const tr = document.createElement('tr');

      // Columna de Técnico Asignado
      const techDisplay = req.technician 
        ? `<span class="cell-tech-assigned">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
             ${escapeHTML(req.technician)}
           </span>`
        : `<span class="cell-tech-unassigned">Sin asignar</span>`;

      // Columna de Fecha Programada
      const dateDisplay = req.scheduledDate
        ? `<span class="scheduled-date-badge">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
             ${req.scheduledDate}
           </span>`
        : `<span class="text-muted" style="font-size: 0.75rem;">Sin programar</span>`;

      // Columna de Acciones
      let actionBtnHTML = '';
      if (req.status === 'En revisión') {
        actionBtnHTML = `
          <div class="action-buttons-group">
            <button class="btn btn-primary btn-sm btn-assign-action" data-request-id="${req.id}" title="Aprobar y asignar técnico con fecha programada">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Aprobar</span>
            </button>
            <button class="btn btn-outline-danger btn-sm btn-reject-action" data-request-id="${req.id}" title="Rechazar solicitud indicando motivo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Rechazar</span>
            </button>
          </div>
        `;
      } else if (req.status === 'Rechazada') {
        actionBtnHTML = `
          <button class="btn btn-secondary btn-sm btn-view-reject-action" data-request-id="${req.id}" title="Ver motivo del rechazo">
            <span>Ver Motivo</span>
          </button>
        `;
      } else {
        actionBtnHTML = `
          <button class="btn btn-secondary btn-sm btn-reassign-action" data-request-id="${req.id}" title="Reasignar técnico o fecha">
            <span>Reasignar</span>
          </button>
        `;
      }

      tr.innerHTML = `
        <td><span class="order-id-tag">${req.id}</span></td>
        <td><strong>${escapeHTML(req.client)}</strong></td>
        <td>
          <span class="cell-service-title">${escapeHTML(req.service)}</span>
          <span class="cell-service-desc">${escapeHTML(req.description)}</span>
        </td>
        <td><span class="cell-address">${escapeHTML(req.address)}</span></td>
        <td>${dateDisplay}</td>
        <td>${techDisplay}</td>
        <td>${getStatusBadgeHTML(req.status)}</td>
        <td class="text-right">${actionBtnHTML}</td>
      `;

      dom.adminTableBody.appendChild(tr);
    });

    // Delegación de eventos para los botones de la tabla
    attachAdminTableEvents();
  }

  function attachAdminTableEvents() {
    // Botones de Aprobar y Asignar
    const assignBtns = dom.adminTableBody.querySelectorAll('.btn-assign-action, .btn-reassign-action');
    assignBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const requestId = btn.getAttribute('data-request-id');
        openAssignModal(requestId);
      });
    });

    // Botones de Rechazar (Administrador)
    const rejectBtns = dom.adminTableBody.querySelectorAll('.btn-reject-action');
    rejectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const requestId = btn.getAttribute('data-request-id');
        openRejectModal(requestId);
      });
    });

    // Botones de Ver Motivo de Rechazo
    const viewRejectBtns = dom.adminTableBody.querySelectorAll('.btn-view-reject-action');
    viewRejectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const requestId = btn.getAttribute('data-request-id');
        const req = state.requests.find(r => r.id === requestId);
        if (req) {
          showToast(`Motivo de rechazo (#${req.id}): ${req.rejectionReason || req.notes}`, 'info');
        }
      });
    });
  }

  dom.adminStatusFilter.addEventListener('change', (e) => {
    state.activeFilterStatus = e.target.value;
    renderAdminDashboard();
  });

  function openAssignModal(requestId) {
    const target = state.requests.find(r => r.id === requestId);
    if (!target) return;

    state.targetRequestIdForAssign = target.id;
    dom.modalRequestSummary.textContent = `Orden de Servicio #${target.id}`;
    dom.modalPreviewClient.textContent = target.client;
    dom.modalPreviewService.textContent = target.service;
    dom.modalPreviewServiceDescription.textContent = target.description;
    dom.modalPreviewAddress.textContent = target.address;

    // Fecha programada por defecto (mañana) si no tiene una asignada
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dom.assignScheduledDate.value = target.scheduledDate || tomorrow.toISOString().split('T')[0];

    // Llenar selector de técnicos usando el estado dinámico
    dom.selectTechnician.innerHTML = '';
    state.technicians.forEach(tech => {
      const option = document.createElement('option');
      option.value = tech.name;
      option.textContent = `${tech.name} — (${tech.specialty})`;
      if (target.technician === tech.name) {
        option.selected = true;
      }
      dom.selectTechnician.appendChild(option);
    });

    dom.assignModal.classList.remove('modal-hidden');
  }

  function closeAssignModal() {
    dom.assignModal.classList.add('modal-hidden');
    state.targetRequestIdForAssign = null;
  }

  dom.modalCloseBtn.addEventListener('click', closeAssignModal);
  dom.modalCancelBtn.addEventListener('click', closeAssignModal);

  dom.assignModal.addEventListener('click', (e) => {
    if (e.target === dom.assignModal) closeAssignModal();
  });

  dom.modalConfirmBtn.addEventListener('click', () => {
    if (!state.targetRequestIdForAssign) return;

    const selectedTech = dom.selectTechnician.value;
    const scheduledDate = dom.assignScheduledDate.value;

    if (!scheduledDate) {
      showToast('Por favor selecciona la fecha programada para la atención.', 'info');
      return;
    }

    const reqIndex = state.requests.findIndex(r => r.id === state.targetRequestIdForAssign);

    if (reqIndex !== -1) {
      const targetReq = state.requests[reqIndex];
      targetReq.technician = selectedTech;
      targetReq.scheduledDate = scheduledDate;
      targetReq.status = "Aprobada y asignada";
      targetReq.notes = `Orden aprobada por la Administración. Asignada a ${selectedTech} para atención en sitio el ${scheduledDate}.`;
      
      persistRequests();
      closeAssignModal();
      renderAdminDashboard();

      // Enviar aviso por correo al cliente vía Resend
      simulateResendEmail(targetReq.clientEmail, 'Aprobada y asignada', `Fecha programada: ${scheduledDate} | Técnico: ${selectedTech}`);
      showToast(`¡Solicitud #${targetReq.id} aprobada y programada con éxito!`, 'success');
    }
  });

  /**
   * ============================================================================
   * GESTIÓN DE RECHAZO DE SOLICITUDES (ROL ADMINISTRADOR)
   * ============================================================================
   */
  function openRejectModal(requestId) {
    const target = state.requests.find(r => r.id === requestId);
    if (!target) return;

    state.targetRequestIdForReject = target.id;
    dom.modalRejectRequestSummary.textContent = `Orden de Servicio #${target.id}`;
    dom.modalRejectPreviewClient.textContent = target.client;
    dom.modalRejectPreviewService.textContent = target.service;
    dom.rejectReasonInput.value = '';

    dom.rejectModal.classList.remove('modal-hidden');
  }

  function closeRejectModal() {
    dom.rejectModal.classList.add('modal-hidden');
    state.targetRequestIdForReject = null;
  }

  dom.modalRejectCloseBtn.addEventListener('click', closeRejectModal);
  dom.modalRejectCancelBtn.addEventListener('click', closeRejectModal);

  dom.rejectModal.addEventListener('click', (e) => {
    if (e.target === dom.rejectModal) closeRejectModal();
  });

  dom.modalRejectConfirmBtn.addEventListener('click', () => {
    if (!state.targetRequestIdForReject) return;

    const reason = dom.rejectReasonInput.value.trim();
    if (!reason) {
      showToast('Es obligatorio registrar el motivo del rechazo.', 'info');
      dom.rejectReasonInput.focus();
      return;
    }

    const reqIndex = state.requests.findIndex(r => r.id === state.targetRequestIdForReject);
    if (reqIndex !== -1) {
      const targetReq = state.requests[reqIndex];
      targetReq.status = "Rechazada";
      targetReq.rejectionReason = reason;
      targetReq.notes = `Solicitud rechazada por la Administración. Motivo registrado: "${reason}".`;

      persistRequests();
      closeRejectModal();
      renderAdminDashboard();

      // Enviar aviso por correo al cliente vía Resend
      simulateResendEmail(targetReq.clientEmail, 'Rechazada', reason);
      showToast(`Solicitud #${targetReq.id} marcada como Rechazada con motivo registrado.`, 'info');
    }
  });

  /**
   * ============================================================================
   * CREACIÓN DE CUENTAS DE USUARIO (ROL ADMINISTRADOR)
   * ============================================================================
   */
  dom.btnOpenCreateUserModal.addEventListener('click', () => {
    dom.createUserForm.reset();
    dom.newUserRole.value = 'tech';
    dom.lblUserDetail.textContent = 'Especialidad Técnica *';
    dom.newUserDetail.placeholder = 'Ej: Redes & Cableado Estructurado';
    dom.createUserModal.classList.remove('modal-hidden');
  });

  function closeCreateUserModal() {
    dom.createUserModal.classList.add('modal-hidden');
  }

  dom.modalCreateUserCloseBtn.addEventListener('click', closeCreateUserModal);
  dom.modalCreateUserCancelBtn.addEventListener('click', closeCreateUserModal);

  dom.createUserModal.addEventListener('click', (e) => {
    if (e.target === dom.createUserModal) closeCreateUserModal();
  });

  dom.newUserRole.addEventListener('change', (e) => {
    if (e.target.value === 'tech') {
      dom.lblUserDetail.textContent = 'Especialidad Técnica *';
      dom.newUserDetail.placeholder = 'Ej: Redes & Cableado Estructurado';
    } else {
      dom.lblUserDetail.textContent = 'Empresa / Razón Social *';
      dom.newUserDetail.placeholder = 'Ej: Soluciones Financieras del Norte';
    }
  });

  dom.createUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = dom.newUserRole.value;
    const name = dom.newUserName.value.trim();
    const email = dom.newUserEmail.value.trim();
    const detail = dom.newUserDetail.value.trim();

    if (!name || !email || !detail) {
      showToast('Por favor completa todos los campos para crear la cuenta.', 'info');
      return;
    }

    if (role === 'tech') {
      const nextId = `TECH-0${state.technicians.length + 1}`;
      const newTech = { id: nextId, name, specialty: detail, email };
      state.technicians.push(newTech);
      persistRequests();
      showToast(`¡Cuenta de Técnico creada con éxito: ${name} (${nextId})!`, 'success');
    } else {
      const nextId = `CLI-0${state.clients.length + 1}`;
      const newClient = { id: nextId, name, email, contact: detail };
      state.clients.push(newClient);
      persistRequests();
      showToast(`¡Cuenta de Cliente creada con éxito: ${name} (${nextId})!`, 'success');
    }

    closeCreateUserModal();
  });


  /* ===========================================================================
     SECCIÓN 5: VISTA 3 - PORTAL DEL TÉCNICO
     =========================================================================== */
  function renderTechPortal() {
    const techName = state.currentUser ? state.currentUser.name : "Juan Pérez";
    dom.techProfileName.textContent = `Técnico: ${techName}`;

    // Filtrar solicitudes asignadas a este técnico
    const myOrders = state.requests.filter(r => r.technician === techName);
    dom.techOrdersCountBadge.textContent = `${myOrders.length} Asignaciones`;

    dom.techOrdersContainer.innerHTML = '';

    if (myOrders.length === 0) {
      dom.techOrdersContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-title">No tienes órdenes asignadas</div>
          <div class="empty-state-desc">Actualmente no cuentas con órdenes pendientes de atención técnica en campo.</div>
        </div>
      `;
      return;
    }

    myOrders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'tech-order-card';

      card.innerHTML = `
        <div class="tech-order-header">
          <span class="order-id-tag">${order.id}</span>
          ${getStatusBadgeHTML(order.status)}
        </div>

        <div class="tech-order-body">
          <h4 class="tech-order-service">${escapeHTML(order.service)}</h4>
          <p class="tech-order-desc">${escapeHTML(order.description)}</p>

          <div class="tech-order-meta">
            <div class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span><strong>Cliente:</strong> ${escapeHTML(order.client)}</span>
            </div>
            <div class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span><strong>Ubicación:</strong> ${escapeHTML(order.address)}</span>
            </div>
          </div>
        </div>

        <form class="tech-order-actions-box tech-order-form" data-request-id="${order.id}">
          <div class="form-group mb-2">
            <label class="form-label">Actualizar Estado del Servicio</label>
            <select class="form-control form-control-sm form-select select-tech-status">
              <option value="Aprobada y asignada" ${order.status === 'Aprobada y asignada' ? 'selected' : ''}>Aprobada y asignada</option>
              <option value="En proceso" ${order.status === 'En proceso' ? 'selected' : ''}>En proceso (Trabajando en sitio)</option>
              <option value="Finalizada" ${order.status === 'Finalizada' ? 'selected' : ''}>Finalizada (Servicio completado)</option>
              <option value="Rechazada" ${order.status === 'Rechazada' ? 'selected' : ''}>Rechazada (No factible / Cancelada)</option>
            </select>
          </div>

          <div class="form-group mb-2">
            <label class="form-label">Notas de Diagnóstico y Seguimiento</label>
            <textarea class="form-control form-control-sm textarea-tech-notes" rows="3" placeholder="Ingresa los hallazgos técnicos, materiales usados o causas del problema...">${escapeHTML(order.notes || '')}</textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-sm btn-block">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Guardar Cambios y Diagnóstico</span>
          </button>
        </form>
      `;

      dom.techOrdersContainer.appendChild(card);
    });

    // Eventos de formulario de las tarjetas del técnico
    attachTechCardEvents();
  }

  function attachTechCardEvents() {
    const forms = dom.techOrdersContainer.querySelectorAll('.tech-order-form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const reqId = form.getAttribute('data-request-id');
        const newStatus = form.querySelector('.select-tech-status').value;
        const newNotes = form.querySelector('.textarea-tech-notes').value.trim();

        const reqIndex = state.requests.findIndex(r => r.id === reqId);
        if (reqIndex !== -1) {
          state.requests[reqIndex].status = newStatus;
          state.requests[reqIndex].notes = newNotes;
          persistRequests();
          renderTechPortal();
          showToast(`Orden #${reqId} actualizada a "${newStatus}".`, 'success');
        }
      });
    });
  }


  /* ===========================================================================
     SECCIÓN 6: VISTA 4 - PORTAL DEL CLIENTE Y MAPA LEAFLET.JS
     =========================================================================== */
  function initOrRefreshClientMap() {
    // Coordenadas centrales de Bogotá, Colombia (Zona Financiera / Chapinero - Chicó)
    const defaultLat = 4.6558;
    const defaultLng = -74.0575;

    const mapElement = document.getElementById('clientMap');
    if (!mapElement) return;

    if (!state.leafletMap) {
      // Crear instancia de mapa Leaflet centrado en Bogotá
      state.leafletMap = L.map('clientMap').setView([defaultLat, defaultLng], 13);

      // Cargar capa de teselas (Tiles) de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(state.leafletMap);

      // Crear marcador arrastrable
      state.leafletMarker = L.marker([defaultLat, defaultLng], {
        draggable: true
      }).addTo(state.leafletMap);

      state.leafletMarker.bindPopup("<b>Ubicación del Servicio</b><br>Haz clic o arrastra para reubicar.").openPopup();

      // Evento: Al arrastrar el marcador
      state.leafletMarker.on('dragend', (e) => {
        const position = state.leafletMarker.getLatLng();
        updateFormCoordinates(position.lat, position.lng);
      });

      // Evento: Al hacer clic en cualquier parte del mapa
      state.leafletMap.on('click', (e) => {
        const { lat, lng } = e.latlng;
        state.leafletMarker.setLatLng([lat, lng]);
        state.leafletMarker.bindPopup(`<b>Coordenadas:</b><br>${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();
        updateFormCoordinates(lat, lng);
      });
    } else {
      // Reajustar tamaño si el contenedor cambió de visibilidad
      state.leafletMap.invalidateSize();
    }
  }

  function updateFormCoordinates(lat, lng) {
    dom.reqLatitude.value = lat;
    dom.reqLongitude.value = lng;
    dom.mapCoordsBadge.textContent = `Lat: ${lat.toFixed(4)} | Lng: ${lng.toFixed(4)}`;

    // Sugerencia dinámica de dirección
    dom.reqAddress.value = `Punto fijado: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
  }

  function renderClientPortal() {
    const clientName = state.currentUser ? state.currentUser.name : "Empresa Inversiones Alfa";
    const myClientRequests = state.requests.filter(r => r.client === clientName);

    dom.clientTableBody.innerHTML = '';

    if (myClientRequests.length === 0) {
      dom.clientTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-title">No tienes solicitudes registradas</div>
              <div class="empty-state-desc">Usa el formulario superior para crear tu primer requerimiento de soporte técnico.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    myClientRequests.forEach(req => {
      const tr = document.createElement('tr');

      const techAssigned = req.technician 
        ? `<span class="cell-tech-assigned">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
             ${escapeHTML(req.technician)}
           </span>`
        : `<span class="cell-tech-unassigned">En espera de asignación</span>`;

      tr.innerHTML = `
        <td><span class="order-id-tag">${req.id}</span></td>
        <td>
          <span class="cell-service-title">${escapeHTML(req.service)}</span>
          <span class="cell-service-desc">${escapeHTML(req.description)}</span>
        </td>
        <td><span class="text-muted">${req.date || 'Reciente'}</span></td>
        <td><span class="text-muted">${req.scheduledDate || 'Sin Programar'}</span></td>
        <td><span class="cell-address">${escapeHTML(req.address)}</span></td>
        <td>${techAssigned}</td>
        <td>${getStatusBadgeHTML(req.status)}</td>
        <td><span class="text-muted" style="font-size: 0.75rem;">${escapeHTML(req.notes || 'Sin notas registradas')}</span></td>
      `;

      dom.clientTableBody.appendChild(tr);
    });
  }

  dom.newRequestForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = dom.reqServiceTitle.value.trim();
    const description = dom.reqDescription.value.trim();
    const address = dom.reqAddress.value.trim();
    const lat = parseFloat(dom.reqLatitude.value) || 4.6558;
    const lng = parseFloat(dom.reqLongitude.value) || -74.0575;

    if (!title || !description || !address) {
      showToast('Por favor completa todos los campos requeridos (*).', 'info');
      return;
    }

    // Generar nuevo ID correlativo simulado
    const nextIdNumber = 1000 + state.requests.length + 1;
    const newId = `REQ-${nextIdNumber}`;

    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRequest = {
      id: newId,
      client: state.currentUser ? state.currentUser.name : "Empresa Inversiones Alfa",
      clientEmail: state.currentUser ? state.currentUser.email : "contacto@inversionesalfa.com",
      service: title,
      description: description,
      address: address,
      lat: lat,
      lng: lng,
      technician: null,
      status: "En revisión",
      date: dateFormatted,
      notes: "Solicitud registrada por el cliente. Pendiente de asignación técnica."
    };

    // Reactividad: Agregar al inicio del arreglo
    state.requests.unshift(newRequest);
    persistRequests();

    // Limpiar formulario
    dom.reqServiceTitle.value = '';
    dom.reqDescription.value = '';

    // Re-renderizar vista
    renderClientPortal();
    showToast(`¡Solicitud #${newId} creada con éxito y enviada a revisión!`, 'success');
  });


  /* ===========================================================================
     SECCIÓN 7: COMPONENTES AUXILIARES Y SISTEMA DE TOASTS
     =========================================================================== */
  function getStatusBadgeHTML(status) {
    switch (status) {
      case "En revisión":
        return `<span class="badge badge-status-revision"><span class="badge-dot"></span>En revisión</span>`;
      case "Aprobada y asignada":
        return `<span class="badge badge-status-asignada"><span class="badge-dot"></span>Aprobada y asignada</span>`;
      case "En proceso":
        return `<span class="badge badge-status-proceso"><span class="badge-dot"></span>En proceso</span>`;
      case "Finalizada":
        return `<span class="badge badge-status-finalizada"><span class="badge-dot"></span>Finalizada</span>`;
      case "Rechazada":
        return `<span class="badge badge-status-rechazada"><span class="badge-dot"></span>Rechazada</span>`;
      default:
        return `<span class="badge badge-neutral"><span class="badge-dot"></span>${escapeHTML(status)}</span>`;
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSVG = type === 'success'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        ${iconSVG}
        <span>${escapeHTML(message)}</span>
      </div>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, 3500);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ===========================================================================
     SECCIÓN 8: ARRANQUE Y PUNTO DE ENTRADA (BOOTSTRAP)
     =========================================================================== */
  initStorage();
  switchView('login');

  console.log("OpsFlow SPA Controller inicializado exitosamente.");
});