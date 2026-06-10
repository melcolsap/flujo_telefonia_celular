sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "co/mitsubishi/flujotelefoniacelular/util/Adapter"
], (Controller, Adapter) => {
    "use strict";

    return Controller.extend("co.mitsubishi.flujotelefoniacelular.controller.List", {
        Adapter: Adapter,
        onInit() {
            this._initUserContext();
            this._initRequestsModel();
            
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

                            this._loadRequests();
                        },
                        error: () => {
                            console.error("Error al obtener Pernr");
                            this._userPernr = "";
                        }
                    });
            });
        },

        _initRequestsModel() {
            const oRequestsModel = new sap.ui.model.json.JSONModel({
                items: []
            });
            this.getView().setModel(oRequestsModel, "requests");
        },

        _loadRequests() {
            const sPernr = this._userPernr;

            const oFilter = new sap.ui.model.Filter(
                "Pernr",
                sap.ui.model.FilterOperator.EQ,
                sPernr
            );

            this.getOwnerComponent().getModel().read("/Listado_SolicitudesSet", {
                filters: [oFilter],
                success: (oData) => {
                    const aItemsAdaptados = Adapter.listFromBackend(oData.results);
                    this.getView().getModel("requests").setProperty("/items", aItemsAdaptados);
                }
            });
        },

        onListItemPress(oEvent) {
            const oData = oEvent.getParameter("listItem")
                .getBindingContext("requests")
                .getObject();

            // Navegar a vista detalle
            let oSplitApp = this.getView();
            while (oSplitApp && !oSplitApp.isA("sap.m.SplitApp")) {
                oSplitApp = oSplitApp.getParent();
            }

            const oDetailPage = oSplitApp.getDetailPages().find(page => page.getId().includes("detailView"));
            oSplitApp.toDetail(oDetailPage);

            // Obtener controller y ejecutar método para cargar en modo display
            const oDetail = oDetailPage.getController();
            oDetail.loadInDisplayMode(oData.Id_Solicitud, oData.PasoActual);
            console.log("Detalle cargado", oData);

        },

        onCreate() {
            let oSplitApp = this.getView();
            while (oSplitApp && !oSplitApp.isA("sap.m.SplitApp")) { // Buscar el componente split app
                oSplitApp = oSplitApp.getParent();
            }
            const oDetailPage = oSplitApp.getDetailPages().find(p => p.getId().includes("detailView"));
            oSplitApp.toDetail(oDetailPage); // Detail View Formulario

            const oDetailController = oDetailPage.getController();
            oDetailController.loadInCreateMode();
        },




    });
});