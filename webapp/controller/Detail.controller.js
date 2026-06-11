sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "co/mitsubishi/flujotelefoniacelular/util/Adapter"
], (Controller, JSONModel, MessageBox, Adapter) => {
    "use strict";

    return Controller.extend("co.mitsubishi.flujotelefoniacelular.controller.Detail", {
        onInit() {
            this._initUiModel();
            this._initCitiesModel();
            this._initManagersModel();
            this._initViewStateModel();
            this._attachUserModelSync();
            this._attachUiModelValidationSync();
            this._loadCities();
            this._loadManagers();
        },

        _getUserPernr() {
            return this.getOwnerComponent().getModel("user").getProperty("/pernr") || "";
        },

        _getUserEmail() {
            return this.getOwnerComponent().getModel("user").getProperty("/email") || "";
        },

        _initUiModel() {
            this.getView().setModel(new JSONModel(this._initEmptyRequest()), "ui");
        },

        _initCitiesModel() {
            this.getView().setModel(new JSONModel({ items: [] }), "cities");
        },

        _initManagersModel() {
            this.getView().setModel(new JSONModel({ items: [] }), "managers");
        },

        _loadCities() {
            const oCitiesModel = this.getView().getModel("cities");

            if (!oCitiesModel || this._bCitiesLoaded) {
                return;
            }

            this._bCitiesLoaded = true;
            this.getOwnerComponent().getModel().read("/CiudadesSet", {
                success: (oData) => {
                    const aItems = (oData.results || [])
                        .map((oCity) => ({
                            Nombre: oCity.Nombre
                        }))
                        .sort((oCityA, oCityB) => oCityA.Nombre.localeCompare(oCityB.Nombre));

                    oCitiesModel.setProperty("/items", aItems);
                },
                error: (oError) => {
                    this._bCitiesLoaded = false;
                    console.error("[Ciudades] Error al cargar ciudades", oError);
                }
            });
        },

        _loadManagers() {
            const oManagersModel = this.getView().getModel("managers");

            if (!oManagersModel || this._bManagersLoaded) {
                return;
            }

            this._bManagersLoaded = true;
            this.getOwnerComponent().getModel().read("/Listado_GerentesSet", {
                success: (oData) => {
                    const aItems = (oData.results || [])
                        .map((oManager) => ({
                            Pernr: String(oManager.Pernr || ""),
                            Nombre: oManager.Nombre || "",
                            JobTitle: oManager.Job_Title || "",
                            JobType: oManager.Job_Type || ""
                        }))
                        .filter((oManager) => oManager.Pernr && oManager.Nombre)
                        .sort((oManagerA, oManagerB) => oManagerA.Nombre.localeCompare(oManagerB.Nombre));

                    oManagersModel.setProperty("/items", aItems);
                    this._syncAprobadorDisplay();
                },
                error: (oError) => {
                    this._bManagersLoaded = false;
                    console.error("[Gerentes] Error al cargar gerentes", oError);
                }
            });
        },

        _buildManagerDisplayText(oManager) {
            return [
                oManager?.Nombre,
                oManager?.JobTitle,
                oManager?.JobType
            ].filter(Boolean).join(" | ");
        },

        _findManagerByPernr(sPernr) {
            const aItems = this.getView().getModel("managers")?.getProperty("/items") || [];
            return aItems.find((oManager) => oManager.Pernr === String(sPernr || "")) || null;
        },

        _setAprobadorSelection(oManager) {
            const oUiModel = this.getView().getModel("ui");

            if (!oUiModel) {
                return;
            }

            if (!oManager) {
                oUiModel.setProperty("/Aprobador", "");
                oUiModel.setProperty("/AprobadorDisplay", "");
                return;
            }

            oUiModel.setProperty("/Aprobador", oManager.Pernr);
            oUiModel.setProperty("/AprobadorDisplay", this._buildManagerDisplayText(oManager));
        },

        _syncAprobadorDisplay() {
            const oUiModel = this.getView().getModel("ui");

            if (!oUiModel) {
                return;
            }

            const sPernr = String(oUiModel.getProperty("/Aprobador") || "");

            if (!sPernr) {
                oUiModel.setProperty("/AprobadorDisplay", "");
                return;
            }

            const oManager = this._findManagerByPernr(sPernr);
            oUiModel.setProperty("/AprobadorDisplay", oManager ? this._buildManagerDisplayText(oManager) : sPernr);
        },

        onAprobadorVHRequest() {
            if (!this._oAprobadorVH) {
                this._oAprobadorVH = sap.ui.xmlfragment("co.mitsubishi.flujotelefoniacelular.view.fragment.AprobadorValueHelp", this);
                this._oAprobadorVH.setModel(this.getView().getModel("managers"), "managers");
                this.getView().addDependent(this._oAprobadorVH);
            }

            this._oAprobadorVH.open();
        },

        onAprobadorVHConfirm(oEvent) {
            const oItem = oEvent.getParameter("selectedItem");

            if (!oItem) {
                return;
            }

            const oManager = oItem.getBindingContext("managers")?.getObject();
            this._setAprobadorSelection(oManager);
        },

        onAprobadorVHSearch(oEvent) {
            const sSearchValue = oEvent.getParameter("value");
            const oFilter = new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("Nombre", sap.ui.model.FilterOperator.Contains, sSearchValue),
                    new sap.ui.model.Filter("JobTitle", sap.ui.model.FilterOperator.Contains, sSearchValue),
                    new sap.ui.model.Filter("JobType", sap.ui.model.FilterOperator.Contains, sSearchValue),
                    new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.Contains, sSearchValue)
                ],
                and: false
            });

            oEvent.getSource().getBinding("items").filter(oFilter);
        },

        // ============================ Centro de Costo Value Help ============================
        onCentroCosteVHRequest() {
            if (!this._oCentroCosteVH) {
                this._oCentroCosteVH = sap.ui.xmlfragment("co.mitsubishi.flujotelefoniacelular.view.fragment.CentroCosteValueHelp", this);
                this._oCentroCosteVH.setModel(this.getOwnerComponent().getModel());
                this.getView().addDependent(this._oCentroCosteVH);
            };
            this._oCentroCosteVH.open();
        },

        onCentroCosteVHConfirm(oEvent) {
            const oItem = oEvent.getParameter("selectedItem");

            if (!oItem) {
                return;
            }

            const oContext = oItem.getBindingContext();
            const sNumeroCentroCoste = oContext?.getProperty("CentroCoste") || "";

            this.getView().getModel("ui").setProperty("/CentroCosto", sNumeroCentroCoste);
        },

        onCentroCosteVHSearch(oEvent) {
            const sSearchValue = oEvent.getParameter("value");

            const aSearchFilters = [
                new sap.ui.model.Filter("CentroCoste", sap.ui.model.FilterOperator.Contains, sSearchValue),
                new sap.ui.model.Filter("Descripcion", sap.ui.model.FilterOperator.Contains, sSearchValue)
            ];

            const oFilter = new sap.ui.model.Filter({
                filters: aSearchFilters,
                and: false     // operation "OR"
            });

            oEvent.getSource().getBinding("items").filter(oFilter);
        },

        _loadCentroCosteDesc(sCentroCoste) {
            this.getOwnerComponent().getModel().read(
                "/ZCDS_CENTRO_COSTE('" + sCentroCoste + "')",
                {
                    success: (oData) => {
                        this.getView().getModel("ui")
                            .setProperty("/NombreCentroCoste", oData.Descripcion);
                    }
                }
            );
        },

        _attachUiModelValidationSync() {
            const oUiModel = this.getView().getModel("ui");

            if (!oUiModel || this._bUiValidationSyncAttached) {
                return;
            }

            this._bUiValidationSyncAttached = true;
            oUiModel.attachPropertyChange(() => {
                this._refreshCreateAvailability();
            });
        },

        _attachUserModelSync() {
            const oUserModel = this.getOwnerComponent().getModel("user");

            if (!oUserModel || this._bUserModelSyncAttached) {
                return;
            }

            this._bUserModelSyncAttached = true;
            this._syncUserFieldsToCreateModel();
            oUserModel.attachEvent("change", this._syncUserFieldsToCreateModel, this);
        },

        _syncUserFieldsToCreateModel(bForceSync) {
            const sPernr = String(this._getUserPernr() || "");
            const sEmail = String(this._getUserEmail() || "");
            const sNombreSolicitante = this._formatNameFromEmail(sEmail);
            const oUiModel = this.getView().getModel("ui");

            if (!oUiModel) {
                return;
            }

            const oData = oUiModel.getData();
            const bIsCreateContext = !oData.IdSolicitud;

            if (!bIsCreateContext && !bForceSync) {
                return;
            }

            const bShouldSyncCreator = bForceSync || !oData.CreadorSolicitud || oData.CreadorSolicitud === this._sLastSyncedPernr;
            const bShouldSyncRequester = bForceSync || !oData.Solicitante || oData.Solicitante === this._sLastSyncedPernr;
            const bShouldSyncName = !!sNombreSolicitante && (bForceSync || !oData.NombreSolicitante || oData.NombreSolicitante === this._sLastAutoFilledNombreSolicitante);

            if (sPernr && bShouldSyncCreator) {
                oUiModel.setProperty("/CreadorSolicitud", sPernr);
            }

            if (sPernr && bShouldSyncRequester) {
                oUiModel.setProperty("/Solicitante", sPernr);
            }

            if (bShouldSyncName) {
                oUiModel.setProperty("/NombreSolicitante", sNombreSolicitante);
                this._sLastAutoFilledNombreSolicitante = sNombreSolicitante;
            }

            if (sPernr) {
                this._sLastSyncedPernr = sPernr;
            }

            this._refreshCreateAvailability();
        },

        _formatNameFromEmail(sEmail) {
            const sLocalPart = String(sEmail || "").split("@")[0];

            if (!sLocalPart) {
                return "";
            }

            return sLocalPart
                .split(/[._-]+/)
                .filter(Boolean)
                .map((sPart) => sPart.charAt(0).toUpperCase() + sPart.slice(1).toLowerCase())
                .join(" ");
        },

        _initEmptyRequest() {
            const sPernr = String(this._getUserPernr() || "");

            return {
                IdSolicitud: "",
                Estado: Adapter.ACCION.CREAR,
                CreadorSolicitud: sPernr,
                TipoSolicitud: "1",
                Solicitante: sPernr,
                NombreSolicitante: "",
                Ciudad: "",
                CentroCosto: "",
                Linea: "",
                CedulaRespActual: "",
                NombreRespActual: "",
                CedulaRespNuevo: "",
                NombreRespNuevo: "",
                PersonaRecibeSim: "",
                CedulaRecibeSim: "",
                Aprobador: "",
                AprobadorDisplay: "",
                ResponsableGestion: "",
                TipoEquipo: "",
                Observacion: "",
                ObsGestion: "",
                ObsAprobador: "",
                Adjuntos: []
            };
        },

        _initViewStateModel() {
            this.getView().setModel(new JSONModel({
                Editable: false,
                showSendRequestButton: false,
                showActionPanel: false,
                allowAction: false,
                showAdjuntos: false,
                fields: this._getFieldVisibilityByTipoSolicitud("1"),
                requiredFields: this._getRequiredFieldsByTipoSolicitud("1"),
                canSendRequest: false
            }), "viewState");
        },

        loadInCreateMode() {
            this.getView().getModel("ui").setData(this._initEmptyRequest());
            this._syncUserFieldsToCreateModel(true);
            this._syncAprobadorDisplay();
            this._setCreateViewState();
            this._applyTypeVisibility(this.getView().getModel("ui").getProperty("/TipoSolicitud"));
            this._refreshCreateAvailability();
        },

        loadInDisplayMode(sIdSolicitud, sPasoActual, sNumCeco) {
            const oPayload = Adapter.mapDetailQueryPayload(sIdSolicitud, sNumCeco);

            sap.ui.core.BusyIndicator.show(0);

            this.getOwnerComponent().getModel().create("/CabeceraSet", oPayload, {
                success: (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    this.getView().getModel("ui").setData(Adapter.mapCabeceraToUiModel(oData));
                    this._syncAprobadorDisplay();
                    this._applyTypeVisibility(oData.TipoSolicitud);
                    this._configureViewStateByPasoActual(sPasoActual);
                    this._refreshCreateAvailability();
                },
                error: (oError) => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(this._extractODataErrorMessage(oError, "Error al obtener el detalle de la solicitud"));
                }
            });
        },

        onTipoSolicitudChange(oEvent) {
            this._applyTypeVisibility(oEvent.getSource().getSelectedKey());
            this._refreshCreateAvailability();
        },

        onSendRequest() {
            if (!this._validateCreate()) {
                return;
            }

            const oUiData = this.getView().getModel("ui").getData();
            const oPayload = Adapter.mapUiModelToCreatePayload(oUiData);

            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().getModel().create("/CabeceraSet", oPayload, {
                success: (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    this._showMessageAndReload("success", "Solicitud creada correctamente con ID: " + oData.IdSolicitud);
                },
                error: (oError) => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(this._extractODataErrorMessage(oError, "Error al crear la solicitud"));
                }
            });
        },

        onSendAction() {
            const sAccion = this.byId("selectAction").getSelectedKey();
            const sObservacion = this.byId("txtAreaObservaciones").getValue();
            const oUiData = this.getView().getModel("ui").getData();

            if (!sAccion) {
                MessageBox.error("Seleccione una acción");
                return;
            }

            const oPayload = Adapter.mapAccionToPayload(oUiData, sAccion, sObservacion, this._getUserPernr());

            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().getModel().create("/Enviar_AccionSet", oPayload, {
                success: (oData) => {
                    sap.ui.core.BusyIndicator.hide();

                    if (oData.Mensaje_Error) {
                        MessageBox.error(oData.Mensaje_Error);
                        return;
                    }

                    this._showMessageAndReload("success", "Acción enviada correctamente");
                },
                error: () => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error al enviar la acción");
                }
            });
        },

        onFileChange(oEvent) {
            const oArchivo = oEvent.getParameter("files")[0];
            if (!oArchivo) {
                return;
            }

            const oReader = new FileReader();

            oReader.onload = (oEventReader) => {
                const sBase64 = oEventReader.target.result.split(",")[1];
                const oAdjunto = Adapter.mapFileToAdjunto(oArchivo, sBase64);
                const aAdjuntos = this.getView().getModel("ui").getProperty("/Adjuntos") || [];

                aAdjuntos.push(oAdjunto);
                this.getView().getModel("ui").setProperty("/Adjuntos", aAdjuntos);
            };

            oReader.readAsDataURL(oArchivo);
        },

        onRemoveAttachment() {
            const oItem = this.byId("listAttachments").getSelectedItem();

            if (!oItem) {
                sap.m.MessageToast.show("Seleccione un adjunto");
                return;
            }

            const iIndice = parseInt(oItem.getBindingContext("ui").getPath().split("/")[2], 10);
            const oModel = this.getView().getModel("ui");
            const aAdjuntos = oModel.getProperty("/Adjuntos");

            aAdjuntos.splice(iIndice, 1);
            oModel.setProperty("/Adjuntos", aAdjuntos);
        },

        onDownloadAttachments() {
            const aSelectedItems = this.byId("listAttachmentsPanel").getSelectedItems();

            if (!aSelectedItems.length) {
                sap.m.MessageToast.show("Seleccione al menos un adjunto");
                return;
            }

            const oUiData = this.getView().getModel("ui").getData();
            const sServiceUrl = this.getOwnerComponent().getModel().sServiceUrl;

            aSelectedItems.forEach(oItem => {
                const oAdjunto = oItem.getBindingContext("ui").getObject();
                const sUrl = sServiceUrl +
                    "/DescargarAdjuntosSet(" +
                    "Id_solicitud='" + String(oUiData.IdSolicitud) + "'," +
                    "Id_adjunto='" + String(oAdjunto.Id_Adjunto) + "'" +
                    ")/$value";

                window.open(sUrl, "_blank");
            });
        },

        _setCreateViewState() {
            const sTipoSolicitud = this.getView().getModel("ui").getProperty("/TipoSolicitud");

            this.getView().getModel("viewState").setData({
                Editable: true,
                showSendRequestButton: true,
                canSendRequest: false,
                showActionPanel: false,
                allowAction: false,
                showAdjuntos: false,
                fields: this._getFieldVisibilityByTipoSolicitud(sTipoSolicitud),
                requiredFields: this._getRequiredFieldsByTipoSolicitud(sTipoSolicitud)
            });
        },

        _configureViewStateByPasoActual(sPasoActual) {
            this.getView().getModel("viewState").setData({
                Editable: false,
                showSendRequestButton: false,
                canSendRequest: false,
                showActionPanel: !!sPasoActual,
                allowAction: !!sPasoActual,
                showAdjuntos: true,
                fields: this.getView().getModel("viewState").getProperty("/fields"),
                requiredFields: this.getView().getModel("viewState").getProperty("/requiredFields")
            });
        },

        _applyTypeVisibility(sTipoSolicitud) {
            const oViewStateModel = this.getView().getModel("viewState");

            oViewStateModel.setProperty("/fields", this._getFieldVisibilityByTipoSolicitud(sTipoSolicitud));
            oViewStateModel.setProperty("/requiredFields", this._getRequiredFieldsByTipoSolicitud(sTipoSolicitud));
        },

        _refreshCreateAvailability() {
            const oViewStateModel = this.getView().getModel("viewState");

            if (!oViewStateModel) {
                return;
            }

            oViewStateModel.setProperty("/canSendRequest", this._isCreateRequestValid());
        },

        _getFieldVisibilityByTipoSolicitud(sTipoSolicitud) {
            const mVisibility = {
                TipoSolicitud: true,
                Solicitante: true,
                NombreSolicitante: true,
                Ciudad: false,
                CentroCosto: false,
                Linea: false,
                CedulaRespActual: false,
                NombreRespActual: false,
                CedulaRespNuevo: false,
                NombreRespNuevo: false,
                PersonaRecibeSim: false,
                CedulaRecibeSim: false,
                Aprobador: false,
                ResponsableGestion: false,
                TipoEquipo: false,
                Observacion: true,
                ObsGestion: false,
                ObsAprobador: false
            };

            switch (String(sTipoSolicitud || "1")) {
                case "1":
                    mVisibility.Ciudad = true;
                    mVisibility.CentroCosto = true;
                    mVisibility.Linea = true;
                    mVisibility.TipoEquipo = true;
                    mVisibility.Aprobador = true;
                    //mVisibility.ResponsableGestion = true;
                    break;
                case "2":
                    mVisibility.CedulaRespActual = true;
                    mVisibility.NombreRespActual = true;
                    mVisibility.CedulaRespNuevo = true;
                    mVisibility.NombreRespNuevo = true;
                    //mVisibility.Aprobador = true;
                    //mVisibility.ResponsableGestion = true;
                    //mVisibility.ObsGestion = true;
                    //mVisibility.ObsAprobador = true;
                    break;
                case "3":
                    mVisibility.PersonaRecibeSim = true;
                    mVisibility.CedulaRecibeSim = true;
                    mVisibility.Ciudad = true;
                    mVisibility.CentroCosto = true;
                    mVisibility.Linea = true;
                    break;
                case "4":
                    mVisibility.Linea = true;
                    mVisibility.TipoEquipo = true;
                    //mVisibility.ObsGestion = true;
                    //mVisibility.ObsAprobador = true;
                    break;
                default:
                    mVisibility.Ciudad = true;
                    mVisibility.CentroCosto = true;
                    mVisibility.Linea = true;
                    mVisibility.TipoEquipo = true;
                    mVisibility.Aprobador = true;
                    //mVisibility.ResponsableGestion = true;
                    break;
            }

            return mVisibility;
        },

        _getRequiredFieldsByTipoSolicitud(sTipoSolicitud) {
            const mRequired = {
                TipoSolicitud: true,
                Solicitante: false,
                NombreSolicitante: true,
                Ciudad: false,
                CentroCosto: false,
                Linea: false,
                CedulaRespActual: false,
                NombreRespActual: false,
                CedulaRespNuevo: false,
                NombreRespNuevo: false,
                PersonaRecibeSim: false,
                CedulaRecibeSim: false,
                Aprobador: false,
                ResponsableGestion: false,
                TipoEquipo: false,
                Observacion: true,
                ObsGestion: false,
                ObsAprobador: false
            };

            switch (String(sTipoSolicitud || "1")) {
                case "1":
                    mRequired.Ciudad = true;
                    mRequired.CentroCosto = true;
                    mRequired.Linea = true;
                    mRequired.TipoEquipo = true;
                    mRequired.Aprobador = true;
                    //mRequired.ResponsableGestion = true;
                    break;
                case "2":
                    mRequired.CedulaRespActual = true;
                    mRequired.NombreRespActual = true;
                    mRequired.CedulaRespNuevo = true;
                    mRequired.NombreRespNuevo = true;
                    //mRequired.Aprobador = true;
                    //mRequired.ResponsableGestion = true;
                    break;
                case "3":
                    mRequired.PersonaRecibeSim = true;
                    mRequired.CedulaRecibeSim = true;
                    mRequired.Ciudad = true;
                    mRequired.CentroCosto = true;
                    mRequired.Linea = true;
                    break;
                case "4":
                    mRequired.Linea = true;
                    mRequired.TipoEquipo = true;
                    break;
                default:
                    mRequired.Ciudad = true;
                    mRequired.CentroCosto = true;
                    mRequired.Linea = true;
                    mRequired.TipoEquipo = true;
                    mRequired.Aprobador = true;
                    //mRequired.ResponsableGestion = true;
                    break;
            }

            return mRequired;
        },

        _getRequiredFieldsForCreate() {
            const oData = this.getView().getModel("ui").getData();
            const oRequiredFields = this.getView().getModel("viewState").getProperty("/requiredFields") || {};
            return [
                { visible: oRequiredFields.TipoSolicitud, value: oData.TipoSolicitud, message: "Seleccione el tipo de solicitud" },
                { visible: oRequiredFields.NombreSolicitante, value: oData.NombreSolicitante, message: "Ingrese el nombre del solicitante" },
                { visible: oRequiredFields.Ciudad, value: oData.Ciudad, message: "Ingrese la ciudad" },
                { visible: oRequiredFields.CentroCosto, value: oData.CentroCosto, message: "Ingrese el centro de costo" },
                { visible: oRequiredFields.Linea, value: oData.Linea, message: "Ingrese la línea" },
                { visible: oRequiredFields.CedulaRespActual, value: oData.CedulaRespActual, message: "Ingrese la cédula del responsable actual" },
                { visible: oRequiredFields.NombreRespActual, value: oData.NombreRespActual, message: "Ingrese el nombre del responsable actual" },
                { visible: oRequiredFields.CedulaRespNuevo, value: oData.CedulaRespNuevo, message: "Ingrese la cédula del responsable nuevo" },
                { visible: oRequiredFields.NombreRespNuevo, value: oData.NombreRespNuevo, message: "Ingrese el nombre del responsable nuevo" },
                { visible: oRequiredFields.PersonaRecibeSim, value: oData.PersonaRecibeSim, message: "Ingrese la persona que recibe la SIM" },
                { visible: oRequiredFields.CedulaRecibeSim, value: oData.CedulaRecibeSim, message: "Ingrese la cédula de quien recibe la SIM" },
                { visible: oRequiredFields.Aprobador, value: oData.Aprobador, message: "Ingrese el aprobador" },
                { visible: oRequiredFields.ResponsableGestion, value: oData.ResponsableGestion, message: "Ingrese el responsable de gestión" },
                { visible: oRequiredFields.TipoEquipo, value: oData.TipoEquipo, message: "Ingrese el tipo de equipo" },
                { visible: oRequiredFields.Observacion, value: oData.Observacion, message: "Ingrese la observación" }
            ];
        },

        _isCreateRequestValid() {
            const aRequired = this._getRequiredFieldsForCreate();

            return aRequired.every((oField) => {
                return !oField.visible || !!oField.value;
            });
        },

        _validateCreate() {
            const aRequired = this._getRequiredFieldsForCreate();

            for (const oField of aRequired) {
                if (oField.visible && !oField.value) {
                    MessageBox.error(oField.message);
                    return false;
                }
            }

            return true;
        },

        _extractODataErrorMessage(oError, sFallbackMessage) {
            const sResponseText = oError?.responseText;

            if (!sResponseText) {
                return sFallbackMessage;
            }

            try {
                const oResponse = JSON.parse(sResponseText);
                return oResponse?.error?.message?.value || sFallbackMessage;
            } catch (oParseError) {
                return sFallbackMessage;
            }
        },

        _showMessageAndReload(sType, sMessage) {
            const mTypes = {
                success: MessageBox.success,
                error: MessageBox.error,
                warning: MessageBox.warning,
                info: MessageBox.information
            };

            (mTypes[sType] || MessageBox.information)(sMessage, {
                actions: [MessageBox.Action.OK],
                onClose: () => {
                    window.location.reload();
                }
            });
        }
    });
});
