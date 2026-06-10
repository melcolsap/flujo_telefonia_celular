sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "co/mitsubishi/flujotelefoniacelular/util/Adapter"
], (Controller, Adapter) => {
    "use strict";

    return Controller.extend("co.mitsubishi.flujotelefoniacelular.controller.List", {
        Adapter: Adapter,

        onInit() {
            this._initRequestsModel();
            this._waitForUserAndLoad();
        },

        _initRequestsModel() {
            this.getView().setModel(new sap.ui.model.json.JSONModel({ items: [] }), "requests");
        },

        _waitForUserAndLoad() {
            const oUserModel = this.getOwnerComponent().getModel("user");

            const fnTryLoad = () => {
                if (this._bRequestsLoaded || !oUserModel.getProperty("/pernr")) {
                    return;
                }
                this._bRequestsLoaded = true;
                this._loadRequests();
            };

            fnTryLoad();
            oUserModel.attachEvent("change", fnTryLoad);
        },

        _loadRequests() {
            const sPernr = this.getOwnerComponent().getModel("user").getProperty("/pernr");

            if (!sPernr) {
                return;
            }

            const oFilter = new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, sPernr);

            this.getOwnerComponent().getModel().read("/Listado_SolicitudesSet", {
                filters: [oFilter],
                success: (oData) => {
                    const aItems = Adapter.listFromBackend(oData.results || []);
                    this.getView().getModel("requests").setProperty("/items", aItems);
                },
                error: () => {
                    sap.m.MessageToast.show("Error al cargar solicitudes");
                }
            });
        },

        _getSplitApp() {
            let oControl = this.getView();

            while (oControl && !oControl.isA("sap.m.SplitApp")) {
                oControl = oControl.getParent();
            }

            return oControl;
        },

        _getDetailView() {
            return this._getSplitApp()?.getDetailPages()[0];
        },

        onListItemPress(oEvent) {
            const oData = oEvent.getParameter("listItem").getBindingContext("requests").getObject();
            const oSplitApp = this._getSplitApp();
            const oDetailView = this._getDetailView();

            if (!oSplitApp || !oDetailView) {
                return;
            }

            oSplitApp.toDetail(oDetailView, "slide");
            oDetailView.getController().loadInDisplayMode(oData.Id_Solicitud, oData.PasoActual);
        },

        onCreate() {
            const oSplitApp = this._getSplitApp();
            const oDetailView = this._getDetailView();

            if (!oSplitApp || !oDetailView) {
                return;
            }

            oSplitApp.toDetail(oDetailView, "slide");
            oDetailView.getController().loadInCreateMode();
        }
    });
});
