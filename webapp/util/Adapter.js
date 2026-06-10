sap.ui.define([], () => {
    "use strict";
    return {
        // Modelo UI -> Payload del Create Deep Entity
        mapUiModelToDeepEntity(oUiModel) {
            return {
                // C para Create - V para visualizar
                Accion: "C",

                CREADOR_SOLICITUD: oUiModel.CreadorSolicitudPernr,
                Tipo_Viaje: oUiModel.TipoViaje,
                NUM_DOCUMENTO: oUiModel.CedulaCiudadania,
                NOMBRE_COMPLETO: oUiModel.NombrePasajero,
                PREAPROBACION: oUiModel.FormatoPreaprobacion,
                ID_PREAPROBACION: Number(oUiModel.IdFormato) || 0,
                TIPO_GASTO: oUiModel.TipoGasto,
                LEGALIZACION_TARJETA: oUiModel.LegalizacionTarjetaCorporativa,
                Motivo_Viaje: oUiModel.MotivoDelViaje,
                Orden: oUiModel.Orden,
                Grafo: oUiModel.Grafo,
                OP: oUiModel.OP,
                EQUIPAJE_MANO: oUiModel.EquipajeDeMano,
                EQUIPAJE_BODEGA: oUiModel.EquipajeDeBodega,
                PRIMER_APROBADOR: Number(oUiModel.PrimerAprobador) || 0,
                SEGUNDO_APROBADOR: Number(oUiModel.SegundoAprobador) || 0,
                Ruta: Number(oUiModel.TipoRuta) || 0,
                RESERVA_HOTEL: oUiModel.ReservaEnHotel,
                OBSERVACION_CREADOR: oUiModel.ObservacionCreador,
                CENTRO_COSTOS: oUiModel.NumeroCentroCoste,
                Desc_Ceco: oUiModel.NombreCentroCoste,

                // Rutas-vuelos
                NavToVuelos: (oUiModel.Rutas || []) // Nombres iguales no requiere mapeo manual
            }
        },

        mapDeepEntityToUiModel(oData) {
            return {
                IdSolicitud: oData.Id_Solicitud,

                CreadorSolicitudPernr: oData.CREADOR_SOLICITUD,
                TipoViaje: oData.Tipo_Viaje,
                CedulaCiudadania: oData.NUM_DOCUMENTO,
                NombrePasajero: oData.NOMBRE_COMPLETO,
                FormatoPreaprobacion: oData.PREAPROBACION,
                IdFormato: oData.ID_PREAPROBACION?.toString() || "",
                TipoGasto: oData.TIPO_GASTO,
                LegalizacionTarjetaCorporativa: oData.LEGALIZACION_TARJETA,
                MotivoDelViaje: oData.Motivo_Viaje,
                Orden: oData.Orden,
                Grafo: oData.Grafo,
                OP: oData.OP,
                EquipajeDeMano: oData.EQUIPAJE_MANO,
                EquipajeDeBodega: oData.EQUIPAJE_BODEGA,
                PrimerAprobador: oData.PRIMER_APROBADOR?.toString() || "",
                SegundoAprobador: oData.SEGUNDO_APROBADOR?.toString() || "",
                TipoRuta: oData.Ruta?.toString() || "",
                ReservaEnHotel: oData.RESERVA_HOTEL,
                ObservacionCreador: oData.OBSERVACION_CREADOR,
                NumeroCentroCoste: oData.CENTRO_COSTOS,
                NombreCentroCoste: oData.Desc_Ceco,

                //  mapear vuelos → rutas (UI)
                Rutas: (oData.NavToVuelos?.results || []).map(vuelo => ({
                    ORIGEN: vuelo.ORIGEN,
                    DESTINO: vuelo.DESTINO,
                    FECHA_IDA: vuelo.FECHA_IDA,
                    HORA_IDA: vuelo.HORA_IDA,
                    FECHA_REGRESO: vuelo.FECHA_REGRESO,
                    HORA_REGRESO: vuelo.HORA_REGRESO
                })),

                // Mapear adjuntos
                Adjuntos: (oData.NavDataToAdjuntos?.results || []).map(oAdjunto => ({
                    Nombre: oAdjunto.Nombre,
                    Tipo: oAdjunto.Tipo,
                    Contenido: oAdjunto.Contenido,
                    ID_FLUJO: oAdjunto.ID_FLUJO,
                    Id_Solicitud: oAdjunto.Id_Solicitud,
                    Id_Adjunto: oAdjunto.Id_Adjunto
                })),

                // Observaciones aprobaciones
                ObservacionCotizaciones: oData.OBSERVACION_COTIZACION,
                ObservacionAprobacionCreador: oData.OBSERVACION_APROBACION_CREADOR,
                ObservacionAprobacionDirector: oData.OBSERVACION_GERENTE_DIREC,
                ObservacionEnvioTiquetes: oData.OBSERVACION_ENVIO_TIQUETES,

                Hoteles: (oData.NavToHoteles?.results || []).map(hotel => ({
                    Id_Hotel: hotel.Id_Hotel,
                    RESPONSABLE_HOTEL: hotel.RESPONSABLE_HOTEL?.toString() || "",
                    OBSERVACION_HOTEL: hotel.OBSERVACION_HOTEL || "",

                    Nombre_Adjunto: hotel.Nombre_Adjunto || "",
                    Tipo_Adjunto: hotel.Tipo_Adjunto || "",
                    Id_Adjunto: hotel.Id_Adjunto

                })),

            };
        },

        mapFileToAdjunto(oArchivo, sBase64) {
            return {
                Nombre: oArchivo.name,
                Tipo: oArchivo.type,
                Contenido: sBase64
            };
        },

        mapAdjuntosToPayload(aAdjuntos, iIdSolicitud) {
            return (aAdjuntos || []).map(oAdjunto => ({
                ID_FLUJO: 1,
                Tipo: oAdjunto.Tipo,
                Contenido: oAdjunto.Contenido,
                Nombre: oAdjunto.Nombre,
                Id_Solicitud: iIdSolicitud
            }));
        },

        listFromBackend: function (aBackendItems) {
            return aBackendItems.map(item => ({
                Id_Solicitud: item.Id_Solicitud,
                CentroCosto: item.Nom_Ceco,
                Pasajero: item.Nom_completo,
                Estado: item.Estado,
                PasoActual: item.Paso_Actual
            }));
        },

        formatStatusText: function (sStatus) {
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

        formatStatusState: function (sStatus) {
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

    }

});