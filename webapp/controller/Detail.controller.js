sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "co/mitsubishi/flujotelefoniacelular/util/Adapter"
], (Controller, JSONModel, MessageBox, Adapter) => {
    "use strict";

    return Controller.extend("co.mitsubishi.flujotelefoniacelular.controller.Detail", {
        onInit() {
            this._initUserContext();
            this._initUiModel();
            this._initViewStateModel();
            this._initTiposGastoModel();
            this._initRutasModel();
            this._initAprobadoresModel();
            this._initResponsablesHotelModel();

        },

        _initUserContext() {
            const sEmail = sap?.ushell?.Container?.getUser?.()?.getEmail?.() || "@";
            this._userEmail = sEmail;
            this.getOwnerComponent().getModel().metadataLoaded().then(() => {
                this.getOwnerComponent().getModel().read(
                    "/Consultar_PernrSet(Correo='" + encodeURIComponent(sEmail) + "')",
                    {
                        success: (oData) => {
                            this._userPernr = oData.Pernr;
                            console.log("User context:", this._userEmail, this._userPernr);
                        },
                        error: () => {
                            console.error("Error al obtener Pernr");
                            this._userPernr = "";
                        }
                    });
            });
        },

        _initUiModel() {
            const oUiModel = new JSONModel(this._initEmptyRequest());
            this.getView().setModel(oUiModel, "ui");
        },

        _initEmptyRequest() {
            return {
                IdSolicitud: "",

                CreadorSolicitudEmail: this._userEmail,
                CreadorSolicitudPernr: this._userPernr,
                TipoViaje: "NACIONAL",
                CedulaCiudadania: "",
                NombrePasajero: "",
                FormatoPreaprobacion: "", // "" = "No"
                IdFormato: "",
                TipoGasto: "001",
                LegalizacionTarjetaCorporativa: "", // "" = "No"
                MotivoDelViaje: "",
                Orden: "",
                Grafo: "",
                OP: "",
                EquipajeDeMano: "", // "" = "No"
                EquipajeDeBodega: "", // "" = "No"
                PrimerAprobador: "",
                SegundoAprobador: "",
                TipoRuta: "1",

                ReservaEnHotel: "",
                ObservacionCreador: "",
                NumeroCentroCoste: "",
                NombreCentroCoste: "",

                Rutas: [{
                    ID_VUELO: 1,
                    ORIGEN: "",
                    DESTINO: "",
                    FECHA_IDA: "",
                    HORA_IDA: "",
                    FECHA_REGRESO: "",
                    HORA_REGRESO: ""
                }],

                Adjuntos: [{
                    Nombre: "",
                    Tipo: "",
                    Contenido: "",
                    ID_FLUJO: "",
                    Id_Solicitud: "",
                    Id_Adjunto: ""
                }],

                ObservacionCotizaciones: "",
                ObservacionAprobacionCreador: "",
                ObservacionAprobacionDirector: "",

                CantidadHoteles: "",
                ResponsableHotel1: "",
                ResponsableHotel2: "",
                ResponsableHotel3: "",
                ResponsableHotel4: "",
                ResponsableHotel5: "",


                HotelSeleccionado: "",
                ObservacionHotelEnvio: "",
                AdjuntoHotelEnvio: []


            }
        },

        _initViewStateModel() {
            const oViewStateModel = new JSONModel({
                Editable: false,
                showSendRequestButton: false,

                allowAddRutas: false,
                allowRemoveRutas: false,
                isRegresoEnabled: false,

                showCotizaciones: false,
                allowSendCotizaciones: false,

                showAprobacionCreador: false,
                allowCreatorApproval: false,

                showAprobacionDirector: false,
                allowDirectorApproval: false,

                showTiquetes: false,
                allowSendTiquetes: false,

                showHotelSection: false,
                allowEditHotelSection: false,

                showEnvioReservaHotel: false,
                allowSendReservaHotel: false

            });

            this.getView().setModel(oViewStateModel, "viewState");
        },

        _initTiposGastoModel() {
            const oTiposGastoModel = new JSONModel();
            this.getView().setModel(oTiposGastoModel, "tiposGasto");

            this.getOwnerComponent().getModel().metadataLoaded().then(() => {
                this.getOwnerComponent().getModel().read("/Tipo_GastoSet", {
                    success: (oData) => {
                        const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                        if (sMensajeError) {
                            MessageBox.error(sMensajeError);
                            return;
                        }
                        oTiposGastoModel.setData(oData.results);
                    },
                    error: () => {
                        MessageBox.error("Error al obtener los tipos de gasto");
                    }
                });
            });
        },

        _initRutasModel() {
            const oRutasModel = new JSONModel();
            this.getView().setModel(oRutasModel, "rutas");

            this.getOwnerComponent().getModel().metadataLoaded().then(() => {
                this.getOwnerComponent().getModel().read("/RutaSet", {
                    success: (oData) => {
                        const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                        if (sMensajeError) {
                            MessageBox.error(sMensajeError);
                            return;
                        }
                        oRutasModel.setData(oData.results);
                    },
                    error: () => {
                        MessageBox.error("Error al obtener las rutas");
                    }
                });
            });
        },


        _initAprobadoresModel() {
            const oAprobadoresModel = new JSONModel();
            const oAprobadoresFiltradosModel = new JSONModel();

            this.getView().setModel(oAprobadoresModel, "aprobadores");
            this.getView().setModel(oAprobadoresFiltradosModel, "aprobadoresFiltrados");

            this.getOwnerComponent().getModel().metadataLoaded().then(() => {
                this.getOwnerComponent().getModel().read("/AprobadorSet", {
                    success: (oData) => {
                        const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                        if (sMensajeError) {
                            MessageBox.error(sMensajeError);
                            return;
                        }

                        const aResults = oData.results;

                        // Insertar opción vacía AL INICIO
                        aResults.unshift({
                            Num_Personal: "",
                            Nom_Aprob: ""
                        });

                        oAprobadoresModel.setData(aResults);
                        oAprobadoresFiltradosModel.setData(aResults);
                    },
                    error: () => {
                        MessageBox.error("Error al obtener los aprobadores");
                    }
                });
            });
        },

        _initResponsablesHotelModel() {
            const oResponsablesModel = new JSONModel();
            this.getView().setModel(oResponsablesModel, "responsablesHotel");

            this.getOwnerComponent().getModel().metadataLoaded().then(() => {
                this.getOwnerComponent().getModel().read("/Listado_responsables_hotelesSet", {
                    success: (oData) => {
                        const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                        if (sMensajeError) {
                            MessageBox.error(sMensajeError);
                            return;
                        }
                        const aResults = oData.results;
                        // OPCIÓN VACÍA 
                        aResults.unshift({
                            Pernr_responsable: "",
                            Nombre: ""
                        });

                        oResponsablesModel.setData(aResults);
                    },
                    error: () => {
                        MessageBox.error("Error al obtener responsables de hotel");
                    }
                });
            });
        },

        loadInCreateMode() {
            const oModel = this.getView().getModel("ui");
            oModel.setData(this._initEmptyRequest());

            this._setCreateViewState();
        },

        loadInDisplayMode(sId, sPasoActual) {
            const oPayload = {
                Accion: "V",
                CREADOR_SOLICITUD: Number(this._userPernr) || 0,
                Id_Solicitud: sId,
                NavToVuelos: [],
                NavToHoteles: [],
                NavDataToAdjuntos: []
            };

            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().getModel().create("/Data_FlujoSet", oPayload, {
                success: (oData) => {
                    console.log("Data recibida del backend:", oData);
                    sap.ui.core.BusyIndicator.hide();
                    const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                    if (sMensajeError) {
                        MessageBox.error(sMensajeError);
                        return;
                    }
                    const oUiData = Adapter.mapDeepEntityToUiModel(oData);

                    this.getView().getModel("ui").setData(oUiData);

                    this._loadCentroCosteDesc(oUiData.NumeroCentroCoste);

                    this._configureViewStateByPasoActual(sPasoActual);
                },
                error: () => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error al obtener detalle");
                }
            });
        },


        onSendRequest() {
            if (!this._validateCreate()) return;

            const oUiData = this.getView().getModel("ui").getData();
            const oPayload = Adapter.mapUiModelToDeepEntity(oUiData);

            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().getModel().create("/Data_FlujoSet", oPayload, {
                success: (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    const sMensajeError = oData.Mensaje_Error;
                    if (sMensajeError) {
                        MessageBox.error(sMensajeError);
                        return;
                    }

                    this._showMessageAndReload("success", "Solicitud creada correctamente con ID: " + oData.Id_Solicitud);
                },
                error: () => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error al crear la solicitud");
                }
            });
        },

        onPrimerAprobadorChange(oEvent) {
            const sPrimerAprobador = oEvent.getSource().getSelectedKey();
            const oAprobadoresFiltradosModel = this.getView().getModel("aprobadoresFiltrados");
            const oFilter = new sap.ui.model.Filter("Aprob_Selec", sap.ui.model.FilterOperator.EQ, sPrimerAprobador);

            this.getOwnerComponent().getModel().read("/AprobadorSet", {
                filters: [oFilter],
                success: (oData) => {
                    const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                    if (sMensajeError) {
                        MessageBox.error(sMensajeError);
                        return;
                    }
                    oAprobadoresFiltradosModel.setData(oData.results);
                },
                error: () => {
                    MessageBox.error("Error al obtener los aprobadores");
                }
            });

            this.getView().getModel("ui").setProperty("/SegundoAprobador", "");
        },

        onCedulaCiudadaniaChange(oEvent) {
            const sCedulaCiudadania = oEvent.getParameter("value");
            const oUiModel = this.getView().getModel("ui");
            const sPathEmpleado = "/Datos_EmpleadoSet(Num_Cedula='" + sCedulaCiudadania + "')";

            if (!sCedulaCiudadania) {
                oUiModel.setProperty("/NombrePasajero", "");
                return;
            }

            this.getOwnerComponent().getModel().read(sPathEmpleado, {
                success: (oData) => {
                    const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                    if (sMensajeError) {
                        MessageBox.error(sMensajeError);
                        return;
                    }
                    oUiModel.setProperty("/NombrePasajero", oData.Nom_completo || "")
                },
                error: () => {
                    oUiModel.setProperty("/NombrePasajero", oData.Nom_completo || "")
                }
            });
        },

        onTipoRutaChange(oEvent) {
            const sTipoRuta = oEvent.getSource().getSelectedKey();

            const oViewState = this.getView().getModel("viewState");
            // Defaults
            oViewState.setProperty("/allowAddRutas", false);
            oViewState.setProperty("/allowRemoveRutas", false);
            oViewState.setProperty("/isRegresoEnabled", false);

            switch (sTipoRuta) {
                case "001": // Ida
                    this._restrictToSingleRuta();
                    this._clearRegresoFields();
                    break;

                case "002": // Ida y regreso
                    oViewState.setProperty("/isRegresoEnabled", true);
                    this._restrictToSingleRuta();
                    break;
                case "003": // Multidestino
                    oViewState.setProperty("/allowAddRutas", true);
                    oViewState.setProperty("/allowRemoveRutas", true);
                    this._clearRegresoFields();
                    break;
            }
        },

        _restrictToSingleRuta: function () {
            const aRutas = this.getView().getModel("ui").getProperty("/Rutas");
            if (aRutas.length > 1) {
                this.getView().getModel("ui").setProperty("/Rutas", [aRutas[0]]);
            }
        },

        _clearRegresoFields: function () {
            const aRutas = this.getView().getModel("ui").getProperty("/Rutas");
            aRutas.forEach(oRuta => {
                oRuta.FECHA_REGRESO = "";
                oRuta.HORA_REGRESO = "";
            });
            this.getView().getModel("ui").setProperty("/Rutas", aRutas);
        },

        onAddRuta: function () {
            const aRutas = this.getView().getModel("ui").getProperty("/Rutas");
            aRutas.push({
                ID_VUELO: aRutas.length + 1,
                ORIGEN: "",
                DESTINO: "",
                FECHA_IDA: "",
                HORA_IDA: "",
                FECHA_REGRESO: "",
                HORA_REGRESO: ""
            });
            this.getView().getModel("ui").setProperty("/Rutas", aRutas);
        },

        onRemoveRuta: function (oEvent) {
            const oItem = oEvent.getSource().getParent();
            const oTable = this.byId("tableRutas");
            const iIndex = oTable.indexOfItem(oItem);
            const aRutas = this.getView().getModel("ui").getProperty("/Rutas");

            aRutas.splice(iIndex, 1); // Elimino la fila
            this.getView().getModel("ui").setProperty("/Rutas", aRutas);
        },

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
            const sNumeroCentroCoste = oItem.getBindingContext().getProperty("CentroCoste");
            const sNombreCentroCoste = oItem.getBindingContext().getProperty("Descripcion");

            if (oItem) {
                this.getView().getModel("ui").setProperty("/NumeroCentroCoste", sNumeroCentroCoste);
                this.getView().getModel("ui").setProperty("/NombreCentroCoste", sNombreCentroCoste);
            };
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

        // Manejo de Adjuntos - COTIZACIONES
        onFileChange(oEvent) {
            const oArchivo = oEvent.getParameter("files")[0];
            if (!oArchivo) return;

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
            const oItemSeleccionado = this.byId("listAttachments").getSelectedItem();

            if (!oItemSeleccionado) {
                sap.m.MessageToast.show("Seleccione un adjunto");
                return;
            }

            const sRuta = oItemSeleccionado.getBindingContext("ui").getPath();
            const iIndice = sRuta.split("/")[2];

            const oModel = this.getView().getModel("ui");
            const aAdjuntos = oModel.getProperty("/Adjuntos");

            aAdjuntos.splice(iIndice, 1);

            oModel.setProperty("/Adjuntos", aAdjuntos);
        },

        onSendCotizaciones() {
            const oUiData = this.getView().getModel("ui").getData();

            const sAccionSeleccionada = this.byId("selectActionCotizaciones").getSelectedKey();
            const sObservacion = this.byId("txtAreaObservacionesCotizaciones").getValue();

            if (sAccionSeleccionada === "SEND") {

                const oPayload = {
                    Id_Solicitud: Number(oUiData.IdSolicitud),
                    Pernr_Responsable: Number(this._userPernr),
                    Pernr_Creador: Number(oUiData.CreadorSolicitudPernr),
                    Accion: "6",
                    Observacion: sObservacion,
                    NavToAdjuntos: Adapter.mapAdjuntosToPayload(
                        oUiData.Adjuntos,
                        oUiData.IdSolicitud
                    )
                };
                console.log("Payload a enviar:", oPayload);
                sap.ui.core.BusyIndicator.show(0);
                this.getOwnerComponent().getModel().create("/Enviar_AccionSet", oPayload, {
                    success: (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                        if (sMensajeError) {
                            MessageBox.error(sMensajeError);
                            return;
                        }
                        this._showMessageAndReload("success", "Acción enviada correctamente: Enviar Cotizaciones");
                    },
                    error: () => {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error("Error al enviar la acción");
                    }
                });

            }

            if (sAccionSeleccionada === "FINISH") {
                const oPayload = {
                    Id_Solicitud: Number(oUiData.IdSolicitud),
                    Pernr_Responsable: Number(this._userPernr),
                    Pernr_Creador: Number(oUiData.CreadorSolicitudPernr),
                    Accion: "5",
                    Observacion: sObservacion,
                    NavToAdjuntos: []
                };

                sap.ui.core.BusyIndicator.show(0);
                this.getOwnerComponent().getModel().create("/Enviar_AccionSet", oPayload, {
                    success: (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        const sMensajeError = oData.Mensaje_Error;
                        if (sMensajeError) {
                            MessageBox.error(sMensajeError);
                            return;
                        }
                        this._showMessageAndReload("success", "Acción enviada correctamente: Finalizar");
                    },
                    error: () => {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error("Error al enviar la acción");
                    }
                });
            }
        },

        onSendCreatorAction() {
            const oUiData = this.getView().getModel("ui").getData();

            const sAccion = this.byId("selectActionAprobacionCreador").getSelectedKey();
            const sObservacion = this.byId("txtObsAprobacionCreador").getValue();

            // Mapear acción 
            let sAccionBackend;

            if (sAccion === "APPROVE") sAccionBackend = "3";
            if (sAccion === "REJECT") sAccionBackend = "4";
            if (sAccion === "FINISH") sAccionBackend = "5";

            const oPayload = {
                Id_Solicitud: Number(oUiData.IdSolicitud),
                Pernr_Responsable: Number(this._userPernr),
                Pernr_Creador: Number(oUiData.CreadorSolicitudPernr),
                Accion: sAccionBackend,
                Observacion: sObservacion,
                NavToAdjuntos: []
            };

            sap.ui.core.BusyIndicator.show(0);

            this.getOwnerComponent().getModel().create("/Enviar_AccionSet", oPayload, {
                success: (oData) => {
                    sap.ui.core.BusyIndicator.hide();

                    const sMensajeError = oData.Mensaje_Error;
                    if (sMensajeError) {
                        MessageBox.error(sMensajeError);
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

        onSendDirectorAction() {
            const oUiData = this.getView().getModel("ui").getData();

            const sAccion = this.byId("selectActionAprobacionDirector").getSelectedKey();
            const sObservacion = this.byId("txtObsAprobacionDirector").getValue();

            // Mapear acción 
            let sAccionBackend;

            if (sAccion === "APPROVE") sAccionBackend = "3";
            if (sAccion === "REJECT") sAccionBackend = "4";
            if (sAccion === "FINISH") sAccionBackend = "5";

            const oPayload = {
                Id_Solicitud: Number(oUiData.IdSolicitud),
                Pernr_Responsable: Number(this._userPernr),
                Pernr_Creador: Number(oUiData.CreadorSolicitudPernr),
                Accion: sAccionBackend,
                Observacion: sObservacion,
                NavToAdjuntos: []
            };

            sap.ui.core.BusyIndicator.show(0);

            this.getOwnerComponent().getModel().create("/Enviar_AccionSet", oPayload, {
                success: (oData) => {
                    sap.ui.core.BusyIndicator.hide();

                    const sMensajeError = oData.Mensaje_Error;
                    if (sMensajeError) {
                        MessageBox.error(sMensajeError);
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

        // MANEJO ADJUNTOS - TIQUETES
        onFileChangeTiquetes(oEvent) {
            const oArchivo = oEvent.getParameter("files")[0];
            if (!oArchivo) return;

            const oReader = new FileReader();

            oReader.onload = (oEventReader) => {
                const sBase64 = oEventReader.target.result.split(",")[1];
                const oAdjunto = Adapter.mapFileToAdjunto(oArchivo, sBase64);
                const aAdjuntos = this.getView().getModel("ui").getProperty("/AdjuntosTiquetes") || [];

                aAdjuntos.push(oAdjunto);
                this.getView().getModel("ui").setProperty("/AdjuntosTiquetes", aAdjuntos);
            };

            oReader.readAsDataURL(oArchivo);
        },

        onRemoveAttachmentTiquetes() {
            const oItem = this.byId("listAttachmentsTiquetes").getSelectedItem();
            if (!oItem) {
                sap.m.MessageToast.show("Seleccione un adjunto");
                return;
            }

            const sPath = oItem.getBindingContext("ui").getPath();
            const iIndex = sPath.split("/")[2];
            const oModel = this.getView().getModel("ui");
            const aAdjuntos = oModel.getProperty("/AdjuntosTiquetes");

            aAdjuntos.splice(iIndex, 1);
            oModel.setProperty("/AdjuntosTiquetes", aAdjuntos);
        },

        onSendTiquetes() {
            const oUiData = this.getView().getModel("ui").getData();

            const sAccionSeleccionada = this.byId("selectActionTiquetes").getSelectedKey();
            const sObservacion = this.byId("txtAreaObservacionesTiquetes").getValue();

            if (sAccionSeleccionada === "SEND") {
                // Respecto a los hoteles
                let aHoteles = [];
                if (oUiData.ReservaEnHotel === "X") {
                    if (!oUiData.CantidadHoteles) {
                        MessageBox.error("Seleccione la cantidad de reservas de hotel");
                        return;
                    }

                    if (oUiData.CantidadHoteles >= 1 && !oUiData.ResponsableHotel1) {
                        MessageBox.error("Seleccione el responsable del hotel 1");
                        return;
                    }

                    // Construir hoteles en payload
                    const iCantidad = Number(oUiData.CantidadHoteles);
                    for (let i = 1; i <= iCantidad; i++) {
                        const sResponsable = oUiData[`ResponsableHotel${i}`];
                        if (!sResponsable) {
                            MessageBox.error(`Seleccione el responsable del hotel ${i}`);
                            return;
                        }
                        aHoteles.push({
                            Id_Solicitud: Number(oUiData.IdSolicitud),
                            Id_Hotel: i,
                            RESPONSABLE_HOTEL: Number(sResponsable)
                        });
                    }
                }

                const oPayload = {
                    Id_Solicitud: Number(oUiData.IdSolicitud),
                    Pernr_Responsable: Number(this._userPernr),
                    Pernr_Creador: Number(oUiData.CreadorSolicitudPernr),
                    Accion: "7",
                    Observacion: sObservacion,
                    NavToAdjuntos: Adapter.mapAdjuntosToPayload(
                        oUiData.AdjuntosTiquetes,
                        oUiData.IdSolicitud
                    ),
                    EnviarAToHoteles: aHoteles
                };

                console.log("Payload a enviar:", oPayload);
                sap.ui.core.BusyIndicator.show(0);
                this.getOwnerComponent().getModel().create("/Enviar_AccionSet", oPayload, {
                    success: (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        const sMensajeError = oData.Mensaje_Error;
                        if (sMensajeError) {
                            MessageBox.error(sMensajeError);
                            return;
                        }

                        this._showMessageAndReload("success", "Acción enviada correctamente: Enviar Tiquetes");
                    },
                    error: () => {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error("Error al enviar la acción");
                    }
                });
            }

            if (sAccionSeleccionada === "FINISH") {
                const oPayload = {
                    Id_Solicitud: Number(oUiData.IdSolicitud),
                    Pernr_Responsable: Number(this._userPernr),
                    Pernr_Creador: Number(oUiData.CreadorSolicitudPernr),
                    Accion: "5",
                    Observacion: sObservacion,
                    NavToAdjuntos: []
                };

                console.log("Payload a enviar:", oPayload);
                sap.ui.core.BusyIndicator.show(0);
                this.getOwnerComponent().getModel().create("/Enviar_AccionSet", oPayload, {
                    success: (oData) => {
                        sap.ui.core.BusyIndicator.hide();
                        const sMensajeError = oData.results?.[0]?.Mensaje_Error;
                        if (sMensajeError) {
                            MessageBox.error(sMensajeError);
                            return;
                        }

                        this._showMessageAndReload("success", "Acción enviada correctamente: Finalizar");
                    },
                    error: () => {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error("Error al enviar la acción");
                    }
                });
            }
        },

        onFileChangeHotelEnvio(oEvent) {
            const oFile = oEvent.getParameter("files")[0];
            if (!oFile) return;

            const oReader = new FileReader();
            oReader.onload = (e) => {
                const sBase64 = e.target.result.split(",")[1];
                const oAdjunto = Adapter.mapFileToAdjunto(oFile, sBase64);

                this.getView().getModel("ui").setProperty("/AdjuntoHotelEnvio", [oAdjunto]);
            };

            oReader.readAsDataURL(oFile);
        },

        onSendReservaHotel() {
            const oUiData = this.getView().getModel("ui").getData();

            if (!oUiData.HotelSeleccionado) {
                MessageBox.error("Seleccione el hotel");
                return;
            }

            // Validar que el responsable del hotel seleccionado sea el mismo que el usuario logueado
            const iHotelSeleccionado = oUiData.HotelSeleccionado;
            let responsableHotel = "";
            for (let hotel of oUiData.Hoteles) {
                if (hotel.Id_Hotel == iHotelSeleccionado) {
                    responsableHotel = hotel.RESPONSABLE_HOTEL;
                    break;
                }
            }
            if (responsableHotel != this._userPernr) {
                MessageBox.error("Usted no es responsable del hotel seleccionado");
                return;
            }

            if (!oUiData.ObservacionHotelEnvio) {
                MessageBox.error("Ingrese la observación");
                return;
            }

            if (!oUiData.AdjuntoHotelEnvio?.length) {
                MessageBox.error("Adjunte el archivo");
                return;
            }

            const oPayload = {
                Id_Solicitud: Number(oUiData.IdSolicitud),
                Pernr_Responsable: Number(this._userPernr),
                Pernr_Creador: Number(oUiData.CreadorSolicitudPernr),
                Accion: "8",

                NavToAdjuntos: Adapter.mapAdjuntosToPayload(
                    oUiData.AdjuntoHotelEnvio,
                    oUiData.IdSolicitud
                ),

                EnviarAToHoteles: [{
                    Id_Solicitud: Number(oUiData.IdSolicitud),
                    Id_Hotel: Number(oUiData.HotelSeleccionado),
                    RESPONSABLE_HOTEL: Number(this._userPernr),
                    OBSERVACION_HOTEL: oUiData.ObservacionHotelEnvio
                }]
            };

            console.log("Payload a enviar para hotel:", oPayload);
            sap.ui.core.BusyIndicator.show(0);
            this.getOwnerComponent().getModel().create("/Enviar_AccionSet", oPayload, {
                success: () => {
                    sap.ui.core.BusyIndicator.hide();
                    this._showMessageAndReload("success", "Reserva enviada correctamente");
                },
                error: () => {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error al enviar reserva");
                }
            });
        },

        onDownloadAttachments() {
            const oList = this.byId("listAttachmentsPanel");
            const aSelectedItems = oList.getSelectedItems();

            if (!aSelectedItems.length) {
                sap.m.MessageToast.show("Seleccione al menos un adjunto");
                return;
            }

            const oUiData = this.getView().getModel("ui").getData();

            const oModel = this.getView().getModel();
            const sServiceUrl = oModel.sServiceUrl;

            aSelectedItems.forEach(oItem => {
                const oContext = oItem.getBindingContext("ui");
                const oAdjunto = oContext.getObject();

                const sIdSolicitud = String(oUiData.IdSolicitud).padStart(10, "0");
                const sIdAdjunto = String(oAdjunto.Id_Adjunto).padStart(10, "0");

                const sUrl =
                    sServiceUrl +
                    "/Descargar_AdjuntoSet(" +
                    "Id_solicitud='" + sIdSolicitud + "'," +
                    "Id_adjunto='" + sIdAdjunto + "'" +
                    ")/$value";

                window.open(sUrl, "_blank");
            });
        },

        // Helpers
        _showMessageAndReload: function (sType, sMessage) {
            const mTypes = {
                success: MessageBox.success,
                error: MessageBox.error,
                warning: MessageBox.warning,
                info: MessageBox.information
            };

            (mTypes[sType] || MessageBox.information)(sMessage, {
                actions: [MessageBox.Action.OK],
                onClose: function () {
                    window.location.reload();
                }
            });
        },

        _setCreateViewState() {
            const oViewState = this.getView().getModel("viewState");

            oViewState.setData({
                Editable: true,
                showSendRequestButton: true,

                allowAddRutas: false,
                allowRemoveRutas: false,
                isRegresoEnabled: false,

                showCotizaciones: false,
                allowSendCotizaciones: false,

                showAprobacionCreador: false,
                allowCreatorApproval: false,

                showAprobacionDirector: false,
                allowDirectorApproval: false,

                showTiquetes: false,
                allowSendTiquetes: false,

                showHotelSection: false,
                allowEditHotelSection: false,

                showReservasHoteles: false,

                showEnvioReservaHotel: false,
                allowSendReservaHotel: false,

                showAdjuntos: false

            });
        },

        _configureViewStateByPasoActual(sPasoActual) {
            const oViewState = this.getView().getModel("viewState");
            const oUiModel = this.getView().getModel("ui");
            const bShowHotel = oUiModel.getData().ReservaEnHotel === "X";

            console.log("Paso actual:", sPasoActual);

            switch (sPasoActual) {

                case "1": // Cotización
                    oViewState.setData({
                        Editable: false,
                        showSendRequestButton: false,

                        allowAddRutas: false,
                        allowRemoveRutas: false,
                        isRegresoEnabled: false,

                        showCotizaciones: true,
                        allowSendCotizaciones: true,

                        showAprobacionCreador: true,
                        allowCreatorApproval: false,

                        showAprobacionDirector: true,
                        allowDirectorApproval: false,

                        showTiquetes: false,
                        allowSendTiquetes: false,

                        showHotelSection: false,
                        allowEditHotelSection: false,

                        showReservasHoteles: false,

                        showEnvioReservaHotel: false,
                        allowSendReservaHotel: false,

                        showAdjuntos: false
                    });
                    break;

                case "2": // Envío Tiquetes
                    oViewState.setData({
                        Editable: false,
                        showSendRequestButton: false,

                        allowAddRutas: false,
                        allowRemoveRutas: false,
                        isRegresoEnabled: false,

                        showCotizaciones: true,
                        allowSendCotizaciones: false,

                        showAprobacionCreador: true,
                        allowCreatorApproval: false,

                        showAprobacionDirector: true,
                        allowDirectorApproval: false,

                        showTiquetes: true,
                        allowSendTiquetes: true,

                        showHotelSection: bShowHotel,
                        allowEditHotelSection: true,

                        showReservasHoteles: false,

                        showEnvioReservaHotel: false,
                        allowSendReservaHotel: false,

                        showAdjuntos: true
                    });
                    break;

                case "3": // Aprobación Creador
                    oViewState.setData({
                        Editable: false,
                        showSendRequestButton: false,

                        allowAddRutas: false,
                        allowRemoveRutas: false,
                        isRegresoEnabled: false,

                        showCotizaciones: true,
                        allowSendCotizaciones: false,

                        showAprobacionCreador: true,
                        allowCreatorApproval: true,

                        showAprobacionDirector: false,
                        allowDirectorApproval: false,

                        showTiquetes: false,
                        allowSendTiquetes: false,

                        showHotelSection: false,
                        allowEditHotelSection: false,

                        showReservasHoteles: false,

                        showEnvioReservaHotel: false,
                        allowSendReservaHotel: false,

                        showAdjuntos: true
                    });
                    break;

                case "4": // Aprobación Director
                    oViewState.setData({
                        Editable: false,
                        showSendRequestButton: false,

                        allowAddRutas: false,
                        allowRemoveRutas: false,
                        isRegresoEnabled: false,

                        showCotizaciones: true,
                        allowSendCotizaciones: false,

                        showAprobacionCreador: true,
                        allowCreatorApproval: false,

                        showAprobacionDirector: true,
                        allowDirectorApproval: true,

                        showTiquetes: false,
                        allowSendTiquetes: false,

                        showHotelSection: false,
                        allowEditHotelSection: false,

                        showReservasHoteles: false,

                        showEnvioReservaHotel: false,
                        allowSendReservaHotel: false,

                        showAdjuntos: true
                    });
                    break;

                case "5": // Envío reserva hotel
                    oViewState.setData({
                        Editable: false,
                        showSendRequestButton: false,

                        allowAddRutas: false,
                        allowRemoveRutas: false,
                        isRegresoEnabled: false,

                        showCotizaciones: true,
                        allowSendCotizaciones: false,

                        showAprobacionCreador: true,
                        allowCreatorApproval: false,

                        showAprobacionDirector: true,
                        allowDirectorApproval: false,

                        showTiquetes: true,
                        allowSendTiquetes: false,

                        showHotelSection: false,
                        allowEditHotelSection: false,

                        showReservasHoteles: true,

                        showEnvioReservaHotel: true,
                        allowSendReservaHotel: true,

                        showAdjuntos: true

                    });
                    break;
                default:
                    break;
            }
        },

        _validateCreate() {
            const data = this.getView().getModel("ui").getData();

            if (!data.CedulaCiudadania) return MessageBox.error("Ingrese la cédula"), false;
            if (!data.NombrePasajero) return MessageBox.error("Ingrese el nombre del pasajero"), false;
            if (!data.MotivoDelViaje) return MessageBox.error("Ingrese el motivo del viaje"), false;
            if (!data.PrimerAprobador) return MessageBox.error("Seleccione el primer aprobador"), false;
            if (!data.SegundoAprobador) return MessageBox.error("Seleccione el segundo aprobador"), false;
            if (!data.NumeroCentroCoste) return MessageBox.error("Ingrese el centro de costo"), false;
            if (!data.TipoRuta) return MessageBox.error("Seleccione el tipo de ruta"), false;

            // Validar Rutas/Vuelos
            for (let ruta of data.Rutas) {
                if (!ruta.ORIGEN || !ruta.DESTINO || !ruta.FECHA_IDA || !ruta.HORA_IDA) {
                    return MessageBox.error("Todos los vuelos deben tener origen, destino, fecha y hora"), false;
                }
            }

            return true;
        },


    });
});