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
            this._initViewStateModel();
            this._attachUserModelSync();
        },

        _getUserPernr() {
            return this.getOwnerComponent().getModel("user").getProperty("/pernr") || "";
        },

        _initUiModel() {
            this.getView().setModel(new JSONModel(this._initEmptyRequest()), "ui");
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
            const oUiModel = this.getView().getModel("ui");

            if (!oUiModel || !sPernr) {
                return;
            }

            const oData = oUiModel.getData();
            const bIsCreateContext = !oData.IdSolicitud;

            if (!bIsCreateContext && !bForceSync) {
                return;
            }

            const bShouldSyncCreator = bForceSync || !oData.CreadorSolicitud || oData.CreadorSolicitud === this._sLastSyncedPernr;
            const bShouldSyncRequester = bForceSync || !oData.Solicitante || oData.Solicitante === this._sLastSyncedPernr;

            if (bShouldSyncCreator) {
                oUiModel.setProperty("/CreadorSolicitud", sPernr);
            }

            if (bShouldSyncRequester) {
                oUiModel.setProperty("/Solicitante", sPernr);
            }

            this._sLastSyncedPernr = sPernr;
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
                fields: this._getFieldVisibilityByTipoSolicitud("1")
            }), "viewState");
        },

        loadInCreateMode() {
            this.getView().getModel("ui").setData(this._initEmptyRequest());
            this._syncUserFieldsToCreateModel(true);
            this._setCreateViewState();
            this._applyTypeVisibility(this.getView().getModel("ui").getProperty("/TipoSolicitud"));
        },

        loadInDisplayMode(sIdSolicitud, sPasoActual) {
            const oPayload = Adapter.mapDetailQueryPayload(sIdSolicitud, this._getUserPernr());

            sap.ui.core.BusyIndicator.show(0);

            this.getOwnerComponent().getModel().create("/CabeceraSet", oPayload, {
                success: (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    this.getView().getModel("ui").setData(Adapter.mapCabeceraToUiModel(oData));
                    this._applyTypeVisibility(oData.TipoSolicitud);
                    this._configureViewStateByPasoActual(sPasoActual);
                },
                error: (oError) => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(this._extractODataErrorMessage(oError, "Error al obtener el detalle de la solicitud"));
                }
            });
        },

        onTipoSolicitudChange(oEvent) {
            this._applyTypeVisibility(oEvent.getSource().getSelectedKey());
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
            this.getView().getModel("viewState").setData({
                Editable: true,
                showSendRequestButton: true,
                showActionPanel: false,
                allowAction: false,
                showAdjuntos: false,
                fields: this._getFieldVisibilityByTipoSolicitud(this.getView().getModel("ui").getProperty("/TipoSolicitud"))
            });
        },

        _configureViewStateByPasoActual(sPasoActual) {
            this.getView().getModel("viewState").setData({
                Editable: false,
                showSendRequestButton: false,
                showActionPanel: !!sPasoActual,
                allowAction: !!sPasoActual,
                showAdjuntos: true,
                fields: this.getView().getModel("viewState").getProperty("/fields")
            });
        },

        _applyTypeVisibility(sTipoSolicitud) {
            this.getView().getModel("viewState").setProperty("/fields", this._getFieldVisibilityByTipoSolicitud(sTipoSolicitud));
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
                    mVisibility.ResponsableGestion = true;
                    break;
                case "2":
                    mVisibility.CedulaRespActual = true;
                    mVisibility.NombreRespActual = true;
                    mVisibility.CedulaRespNuevo = true;
                    mVisibility.NombreRespNuevo = true;
                    mVisibility.Aprobador = true;
                    mVisibility.ResponsableGestion = true;
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

        _validateCreate() {
            const oData = this.getView().getModel("ui").getData();
            const oFields = this.getView().getModel("viewState").getProperty("/fields") || {};
            const aRequired = [
                { visible: oFields.NombreSolicitante, value: oData.NombreSolicitante, message: "Ingrese el nombre del solicitante" },
                { visible: oFields.Ciudad, value: oData.Ciudad, message: "Ingrese la ciudad" },
                { visible: oFields.CentroCosto, value: oData.CentroCosto, message: "Ingrese el centro de costo" },
                { visible: oFields.Linea, value: oData.Linea, message: "Ingrese la línea" },
                { visible: oFields.CedulaRespActual, value: oData.CedulaRespActual, message: "Ingrese la cédula del responsable actual" },
                { visible: oFields.NombreRespActual, value: oData.NombreRespActual, message: "Ingrese el nombre del responsable actual" },
                { visible: oFields.CedulaRespNuevo, value: oData.CedulaRespNuevo, message: "Ingrese la cédula del responsable nuevo" },
                { visible: oFields.NombreRespNuevo, value: oData.NombreRespNuevo, message: "Ingrese el nombre del responsable nuevo" },
                { visible: oFields.PersonaRecibeSim, value: oData.PersonaRecibeSim, message: "Ingrese la persona que recibe la SIM" },
                { visible: oFields.CedulaRecibeSim, value: oData.CedulaRecibeSim, message: "Ingrese la cédula de quien recibe la SIM" },
                { visible: oFields.Aprobador, value: oData.Aprobador, message: "Ingrese el aprobador" },
                { visible: oFields.ResponsableGestion, value: oData.ResponsableGestion, message: "Ingrese el responsable de gestión" },
                { visible: oFields.TipoEquipo, value: oData.TipoEquipo, message: "Ingrese el tipo de equipo" },
                { visible: oFields.Observacion, value: oData.Observacion, message: "Ingrese la observación" }
            ];

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
