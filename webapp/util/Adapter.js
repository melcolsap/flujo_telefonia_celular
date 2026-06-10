sap.ui.define([], () => {
    "use strict";

    const ACCION = {
        CREAR: "C"
    };

    function toStringValue(vValue) {
        return vValue === null || vValue === undefined ? "" : String(vValue);
    }

    return {
        ACCION,

        mapUiModelToCreatePayload(oUiModel) {
            return {
                Estado: toStringValue(oUiModel.Estado),
                CreadorSolicitud: toStringValue(oUiModel.CreadorSolicitud),
                TipoSolicitud: toStringValue(oUiModel.TipoSolicitud),
                Solicitante: toStringValue(oUiModel.Solicitante),
                NombreSolicitante: toStringValue(oUiModel.NombreSolicitante),
                Ciudad: toStringValue(oUiModel.Ciudad),
                CentroCosto: toStringValue(oUiModel.CentroCosto),
                Linea: toStringValue(oUiModel.Linea),
                CedulaRespActual: toStringValue(oUiModel.CedulaRespActual),
                NombreRespActual: toStringValue(oUiModel.NombreRespActual),
                CedulaRespNuevo: toStringValue(oUiModel.CedulaRespNuevo),
                NombreRespNuevo: toStringValue(oUiModel.NombreRespNuevo),
                PersonaRecibeSim: toStringValue(oUiModel.PersonaRecibeSim),
                CedulaRecibeSim: toStringValue(oUiModel.CedulaRecibeSim),
                Aprobador: toStringValue(oUiModel.Aprobador),
                ResponsableGestion: toStringValue(oUiModel.ResponsableGestion),
                TipoEquipo: toStringValue(oUiModel.TipoEquipo),
                Observacion: toStringValue(oUiModel.Observacion),
                ObsGestion: toStringValue(oUiModel.ObsGestion),
                ObsAprobador: toStringValue(oUiModel.ObsAprobador),
                CabToAdjuntoSet: this.mapAdjuntosToPayload(oUiModel.Adjuntos)
            };
        },

        mapDetailQueryPayload(sIdSolicitud, sCreadorSolicitud) {
            return {
                Estado: "V",
                CreadorSolicitud: toStringValue(sCreadorSolicitud),
                IdSolicitud: Number(sIdSolicitud) || 0,
                CabToAdjuntoSet: []
            };
        },

        mapCabeceraToUiModel(oData) {
            const aAdjuntos = oData.CabToAdjuntoSet?.results || oData.CabToAdjuntoSet || [];

            return {
                IdSolicitud: oData.IdSolicitud,
                Estado: oData.Estado,
                CreadorSolicitud: oData.CreadorSolicitud,
                TipoSolicitud: oData.TipoSolicitud,
                Solicitante: oData.Solicitante,
                NombreSolicitante: oData.NombreSolicitante,
                Ciudad: oData.Ciudad,
                CentroCosto: oData.CentroCosto,
                Linea: oData.Linea,
                CedulaRespActual: oData.CedulaRespActual,
                NombreRespActual: oData.NombreRespActual,
                CedulaRespNuevo: oData.CedulaRespNuevo,
                NombreRespNuevo: oData.NombreRespNuevo,
                PersonaRecibeSim: oData.PersonaRecibeSim,
                CedulaRecibeSim: oData.CedulaRecibeSim,
                Aprobador: oData.Aprobador,
                ResponsableGestion: oData.ResponsableGestion,
                TipoEquipo: oData.TipoEquipo,
                Observacion: oData.Observacion,
                ObsGestion: oData.ObsGestion,
                ObsAprobador: oData.ObsAprobador,
                Adjuntos: aAdjuntos.map(oAdjunto => ({
                    Nombre: oAdjunto.Nombre,
                    Tipo: oAdjunto.Tipo,
                    Contenido: oAdjunto.Contenido,
                    ID_FLUJO: "2",//oAdjunto.ID_FLUJO,
                    //Id_Solicitud: oAdjunto.Id_Solicitud,
                    //Id_Adjunto: oAdjunto.Id_Adjunto
                }))
            };
        },

        mapFileToAdjunto(oArchivo, sBase64) {
            return {
                Nombre: toStringValue(oArchivo.name),
                Tipo: toStringValue(oArchivo.type),
                Contenido: toStringValue(sBase64),
                ID_FLUJO: 2
            };
        },

        mapAdjuntosToPayload(aAdjuntos) {
            return (aAdjuntos || [])
                .filter(oAdjunto => oAdjunto.Nombre)
                .map(oAdjunto => ({
                    ID_FLUJO: oAdjunto.ID_FLUJO || 2,
                    Tipo: toStringValue(oAdjunto.Tipo),
                    Contenido: toStringValue(oAdjunto.Contenido),
                    Nombre: toStringValue(oAdjunto.Nombre)
                }));
        },

        mapAccionToPayload(oUiData, sAccion, sObservacion, iPernr) {
            return {
                Id_Solicitud: Number(oUiData.IdSolicitud),
                Accion: sAccion,
                Observacion: sObservacion,
                TipoSolicitud: oUiData.TipoSolicitud,
                Pernr_Responsable: Number(iPernr) || 0,
                Pernr_Creador: Number(oUiData.CreadorSolicitud) || 0,
                EnviarToAdjuntoSet: []
            };
        },

        listFromBackend(aBackendItems) {
            return aBackendItems.map(item => ({
                Id_Solicitud: item.Id_Solicitud,
                CentroCosto: item.Nom_Ceco,
                Solicitante: item.Nom_completo,
                Estado: item.Estado,
                PasoActual: item.Paso_Actual
            }));
        },

        formatStatusText(sStatus) {
            switch (sStatus) {
                case "1":
                    return "En Proceso";
                case "2":
                    return "Rechazado";
                case "3":
                    return "Aprobado";
                default:
                    return sStatus;
            }
        },

        formatStatusState(sStatus) {
            switch (sStatus) {
                case "1":
                    return "None";
                case "2":
                    return "Error";
                case "3":
                    return "Success";
                default:
                    return "None";
            }
        }
    };
});
