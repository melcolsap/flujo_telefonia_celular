sap.ui.define([
    "sap/ui/core/UIComponent",
    "co/mitsubishi/flujotelefoniacelular/model/models",
    "sap/ui/model/json/JSONModel"
], (UIComponent, models, JSONModel) => {
    "use strict";

    return UIComponent.extend("co.mitsubishi.flujotelefoniacelular.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

             // trace every OData request sent by the app
            this._attachODataDebugging();

            // user context
            this._initUserContext();

            // enable routing
            this.getRouter().initialize();
        },

        // ============================
        // User Context
        // ============================
        _attachODataDebugging() {
            const oModel = this.getModel();

            if (!oModel || this._bODataDebugAttached) {
                return;
            }

            this._bODataDebugAttached = true;

            console.log("[OData][Init] Debug tracing enabled", {
                serviceUrl: oModel.sServiceUrl
            });

            oModel.attachRequestSent((oEvent) => {
                console.log("[OData][RequestSent]", this._buildDebugPayload(oEvent));
            });

            oModel.attachRequestCompleted((oEvent) => {
                console.log("[OData][RequestCompleted]", this._buildDebugPayload(oEvent));
            });

            oModel.attachRequestFailed((oEvent) => {
                console.error("[OData][RequestFailed]", this._buildDebugPayload(oEvent));
            });

            oModel.attachBatchRequestSent((oEvent) => {
                console.log("[OData][BatchRequestSent]", this._buildDebugPayload(oEvent));
            });

            oModel.attachBatchRequestCompleted((oEvent) => {
                console.log("[OData][BatchRequestCompleted]", this._buildDebugPayload(oEvent));
            });

            oModel.attachBatchRequestFailed((oEvent) => {
                console.error("[OData][BatchRequestFailed]", this._buildDebugPayload(oEvent));
            });
        },

        _buildDebugPayload(oEvent) {
            const oParameters = oEvent.getParameters ? oEvent.getParameters() : {};
            const oResponse = oParameters.response || {};

            return {
                ID: oParameters.ID,
                method: oParameters.method || oParameters.type,
                url: oParameters.url,
                path: oParameters.path,
                success: oParameters.success,
                message: oParameters.message,
                statusCode: oParameters.statusCode || oResponse.statusCode,
                statusText: oParameters.statusText || oResponse.statusText,
                responseText: oResponse.responseText || oParameters.responseText,
                headers: oResponse.headers || oParameters.headers,
                request: oParameters.requests
            };
        },

        _initUserContext: async function () {
            const oUserModel = new JSONModel();
            this.setModel(oUserModel, "user");

            const sEmail = sap?.ushell?.Container?.getUser?.()?.getEmail?.() || "carlos.bermudez@melcol.com.co";

            console.log("[UserContext] Starting Pernr lookup", {
                email: sEmail
            });

            try {
                const sPernr = await this._readPernrRequest(sEmail);
                //const sPernr = 1933;
                //const sPernr = 223;

                oUserModel.setData({
                    email: sEmail,
                    pernr: sPernr
                });

                console.log("[UserContext] Pernr lookup success", {
                    email: sEmail,
                    pernr: sPernr
                });
                console.log("[UserContext] Model user", oUserModel.getData());
            } catch (oError) {
                console.error("[UserContext] Pernr lookup failed", {
                    email: sEmail,
                    error: oError
                });
            }
        },

        _readPernrRequest(sEmail) {
            return new Promise((resolve, reject) => {
                const sCorreoEncoded = encodeURIComponent(sEmail);

                console.log("[UserContext] Reading Consultar_PernrSet", {
                    path: "/Consultar_PernrSet(Correo='" + sCorreoEncoded + "')",
                    email: sEmail
                });

                this.getModel().read("/Consultar_PernrSet(Correo='" + sCorreoEncoded + "')", {
                    success: (oData) => {
                        console.log("[UserContext] Consultar_PernrSet response", oData);
                        resolve(oData.Pernr);
                    },
                    error: (oError) => {
                        console.error("[UserContext] Consultar_PernrSet error", oError);
                        reject(oError);
                    }
                });
            });
        }

    });
});
