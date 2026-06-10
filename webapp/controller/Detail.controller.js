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
        },

        _getUserPernr() {
            return this.getOwnerComponent().getModel("user").getProperty("/pernr") || "";
        },

        _initUiModel() {
            this.getView().setModel(new JSONModel(this._initEmptyRequest()), "ui");
        },

        _initEmptyRequest() {
            const sPernr = this._getUserPernr();

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
                showAdjuntos: false
            }), "viewState");
        },

        loadInCreateMode() {
            this.getView().getModel("ui").setData(this._initEmptyRequest());
            this._setCreateViewState();
        },

        loadInDisplayMode(sIdSolicitud, sPasoActual) {
            sap.ui.core.BusyIndicator.show(0);

            this.getOwnerComponent().getModel().read("/CabeceraSet(" + sIdSolicitud + ")", {
                urlParameters: {
                    "$expand": "CabToAdjuntoSet"
                },
                success: (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    this.getView().getModel("ui").setData(Adapter.mapCabeceraToUiModel(oData));
                    this._configureViewStateByPasoActual(sPasoActual);
                },
                error: () => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error al obtener el detalle de la solicitud");
                }
            });
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
                error: () => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error al crear la solicitud");
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
                showAdjuntos: false
            });
        },

        _configureViewStateByPasoActual(sPasoActual) {
            this.getView().getModel("viewState").setData({
                Editable: false,
                showSendRequestButton: false,
                showActionPanel: !!sPasoActual,
                allowAction: !!sPasoActual,
                showAdjuntos: true
            });
        },

        _validateCreate() {
            const oData = this.getView().getModel("ui").getData();
            const aRequired = [
                { value: oData.NombreSolicitante, message: "Ingrese el nombre del solicitante" },
                { value: oData.Ciudad, message: "Ingrese la ciudad" },
                { value: oData.CentroCosto, message: "Ingrese el centro de costo" },
                { value: oData.Linea, message: "Ingrese la línea" },
                { value: oData.CedulaRespActual, message: "Ingrese la cédula del responsable actual" },
                { value: oData.NombreRespActual, message: "Ingrese el nombre del responsable actual" },
                { value: oData.CedulaRespNuevo, message: "Ingrese la cédula del responsable nuevo" },
                { value: oData.NombreRespNuevo, message: "Ingrese el nombre del responsable nuevo" },
                { value: oData.PersonaRecibeSim, message: "Ingrese la persona que recibe la SIM" },
                { value: oData.CedulaRecibeSim, message: "Ingrese la cédula de quien recibe la SIM" },
                { value: oData.Aprobador, message: "Ingrese el aprobador" },
                { value: oData.ResponsableGestion, message: "Ingrese el responsable de gestión" },
                { value: oData.TipoEquipo, message: "Ingrese el tipo de equipo" },
                { value: oData.Observacion, message: "Ingrese la observación" }
            ];

            for (const oField of aRequired) {
                if (!oField.value) {
                    MessageBox.error(oField.message);
                    return false;
                }
            }

            return true;
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
