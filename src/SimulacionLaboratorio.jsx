// src/SimulacionLaboratorio.jsx
import React, { useState } from "react";
import VectorEstadoLaboratorio from "./VectorEstadoLaboratorio";

const SimulacionLaboratorio = () => {
  const [filas, setFilas] = useState([]);
  const [desde, setDesde] = useState(0);
  const [hasta, setHasta] = useState(100);
  const [cantidadSimulaciones, setCantidadSimulaciones] = useState(300);
  const [cargando, setCargando] = useState(false);

  const simular = () => {
    setCargando(true);
    setTimeout(() => {
      try {
        console.log("Iniciando simulación...");
        
        // Validaciones
        if (cantidadSimulaciones <= 0) {
          alert("La cantidad de simulaciones debe ser mayor a 0");
          setCargando(false);
          return;
        }
      if (desde < 0 || hasta < 0) {
        alert("Los valores 'desde' y 'hasta' deben ser mayores o iguales a 0");
        setCargando(false);
        return;
      }
      if (desde >= cantidadSimulaciones) {
        alert("El valor 'desde' debe ser menor que la cantidad de simulaciones");
        setCargando(false);
        return;
      }
      if (hasta <= desde) {
        alert("El valor 'hasta' debe ser mayor que 'desde'");
        setCargando(false);
        return;
      }
      if (hasta > cantidadSimulaciones) {
        alert("El valor 'hasta' no puede ser mayor que la cantidad de simulaciones");
        setCargando(false);
        return;
      }

      // OPTIMIZACIÓN: Vectores reutilizables en memoria
      const filasSimulacion = [];
      const equiposSimulados = [];
      let reloj = 0;
      const rndInicial = Math.random();
      const tiempoInicial = generarTiempoEntreLlegadas();
      let proximaLlegada = tiempoInicial;
      
      // Para verificar que los RNDs sean únicos
      const rndsGenerados = new Set();
      rndsGenerados.add(rndInicial);
      
      console.log("Parámetros:", { cantidadSimulaciones, desde, hasta, proximaLlegada });
      console.log("RND inicial:", rndInicial.toFixed(4), "Tiempo inicial:", tiempoInicial.toFixed(2));

      // OPTIMIZACIÓN: Vectores reutilizables
      let vectorActual = new VectorEstadoLaboratorio();
      let vectorAnterior = new VectorEstadoLaboratorio();
      
      // Estado inicial
      vectorActual.evento = "inicialización";
      vectorActual.reloj = reloj;
      vectorActual.rndLlegada = rndInicial;
      vectorActual.tiempoEntreLlegadas = tiempoInicial;
      vectorActual.proximaLlegada = proximaLlegada;
      vectorActual.tecnico1 = { estado: "libre", equipo: null };
      vectorActual.tecnico2 = { estado: "libre", equipo: null };
      vectorActual.colaEspera = [];
      vectorActual.equiposRechazados = 0;
      vectorActual.equiposAtendidos = 0;
      vectorActual.tiempoTotalPermanencia = 0;
      vectorActual.usoTecnico1 = 0;
      vectorActual.usoTecnico2 = 0;
      vectorActual.tiempoInicioOcupacionTec1 = -1;
      vectorActual.tiempoInicioOcupacionTec2 = -1;
      
      // Asegurar que la cola esté inicializada
      if (!vectorActual.colaEspera) {
        vectorActual.colaEspera = [];
      }

      // OPTIMIZACIÓN: Solo almacenar filas del rango solicitado
      if (0 >= desde && 0 <= hasta) {
        filasSimulacion.push(vectorActual.toRow());
      }

      let iteraciones = 0;
      const maxIteraciones = cantidadSimulaciones * 20; // Límite de seguridad más alto
      
      while (equiposSimulados.length < cantidadSimulaciones && iteraciones < maxIteraciones) {
        iteraciones++;
        
        if (iteraciones % 50 === 0) {
          console.log(`Iteración ${iteraciones}, equipos simulados: ${equiposSimulados.length}, reloj: ${reloj.toFixed(2)}`);
        }
        
        // OPTIMIZACIÓN: Intercambiar vectores en lugar de crear nuevos
        [vectorAnterior, vectorActual] = [vectorActual, vectorAnterior];
        vectorActual.copiarDesde(vectorAnterior);

        // Determinar próximo evento
        const eventos = [
          vectorAnterior.proximaLlegada,
          vectorAnterior.finTrabajo1,
          vectorAnterior.finTrabajo2,
          vectorAnterior.retornoTrabajo1,
          vectorAnterior.retornoTrabajo2
        ].filter(e => e >= 0);

        if (eventos.length === 0) {
          console.log("No hay eventos activos, terminando simulación");
          break;
        }

        const proximo = Math.min(...eventos);
        reloj = proximo;
        vectorActual.reloj = reloj;

        console.log(`Evento: ${proximo}, Reloj: ${reloj.toFixed(2)}, Equipos: ${equiposSimulados.length}`);

        // Procesar evento
        if (proximo === vectorAnterior.proximaLlegada) {
          vectorActual.evento = `llegada_equipo_${equiposSimulados.length + 1}`;
          // Llegada de equipo
          const rndLlegada = Math.random();
          const tiempoEntreLlegadas = generarTiempoEntreLlegadas();
          proximaLlegada = reloj + tiempoEntreLlegadas;

          // Generar tipo de trabajo para la PRÓXIMA llegada
          const rndProximaLlegada = Math.random();
          const proximaLlegadaTipo = determinarTipoTrabajo(rndProximaLlegada);

          const rndTipoTrabajo = Math.random();
          const trabajo = determinarTipoTrabajo(rndTipoTrabajo);
          const tiempoTrabajo = generarTiempoTrabajo(trabajo);
          
          // Asignar valores al vector actual
          // Verificar que los RNDs sean únicos
          if (rndsGenerados.has(rndLlegada)) {
            console.warn(`RND duplicado detectado: ${rndLlegada.toFixed(4)}`);
          }
          if (rndsGenerados.has(rndTipoTrabajo)) {
            console.warn(`RND duplicado detectado: ${rndTipoTrabajo.toFixed(4)}`);
          }
          rndsGenerados.add(rndLlegada);
          rndsGenerados.add(rndTipoTrabajo);

          const equipo = {
            id: equiposSimulados.length + 1,
            llegada: reloj,
            tipo: trabajo,
            duracion: tiempoTrabajo,
            estado: "ER" // Esperando Reparación
          };

          vectorActual.rndLlegada = rndLlegada;
          vectorActual.tiempoEntreLlegadas = tiempoEntreLlegadas;
          vectorActual.proximaLlegada = proximaLlegada;
          vectorActual.proximaLlegadaTipo = proximaLlegadaTipo;
          vectorActual.rndTipoTrabajo = rndTipoTrabajo;
          vectorActual.trabajo = trabajo;
          vectorActual.tiempoTrabajo = tiempoTrabajo;

          equiposSimulados.push(equipo);
          console.log(`Equipo ${equipo.id} creado: ${equipo.tipo}, duración: ${equipo.duracion}`);
          console.log(`RNDs: llegada=${rndLlegada.toFixed(4)}, tipo=${rndTipoTrabajo.toFixed(4)}`);

          // Asignar a técnico o cola
          const tecnico1Libre = vectorActual.tecnico1.estado === "libre";
          const tecnico2Libre = vectorActual.tecnico2.estado === "libre";

          if (tecnico1Libre) {
            vectorActual.tecnico1.estado = "ocupado";
            vectorActual.tecnico1.equipo = equipo;
            equipo.estado = "SR";
            equipo.tecnico = 1;
            vectorActual.tiempoInicioOcupacionTec1 = reloj;
            vectorActual[`estado_${equipo.id}`] = "SR";
            vectorActual[`llegada_${equipo.id}`] = equipo.llegada.toFixed(2);

            // Generar RND para fin de trabajo
            const rndFinTrabajo = Math.random();
            vectorActual.rndFinTrabajo = rndFinTrabajo;

            if (trabajo === "C") {
              // Interrupción: técnico sale a los 25 min, regresa 10 min antes del fin
              vectorActual.finTrabajo1 = reloj + 25;
              vectorActual.retornoTrabajo1 = reloj + tiempoTrabajo - 10;
              // Registrar la interrupción
              vectorActual.iniciarInterrupcionC(equipo, 1, reloj);
            } else {
              vectorActual.finTrabajo1 = reloj + tiempoTrabajo;
            }
          } else if (tecnico2Libre) {
            vectorActual.tecnico2.estado = "ocupado";
            vectorActual.tecnico2.equipo = equipo;
            equipo.estado = "SR";
            equipo.tecnico = 2;
            vectorActual.tiempoInicioOcupacionTec2 = reloj;
            vectorActual[`estado_${equipo.id}`] = "SR";
            vectorActual[`llegada_${equipo.id}`] = equipo.llegada.toFixed(2);

            // Generar RND para fin de trabajo
            const rndFinTrabajo = Math.random();
            vectorActual.rndFinTrabajo = rndFinTrabajo;

            if (trabajo === "C") {
              vectorActual.finTrabajo2 = reloj + 25;
              vectorActual.retornoTrabajo2 = reloj + tiempoTrabajo - 10;
              // Registrar la interrupción
              vectorActual.iniciarInterrupcionC(equipo, 2, reloj);
            } else {
              vectorActual.finTrabajo2 = reloj + tiempoTrabajo;
            }
          } else {
            // Ambos técnicos ocupados
            if (vectorActual.colaEspera && vectorActual.colaEspera.length < 3) {
              vectorActual.colaEspera.push(equipo);
              vectorActual[`estado_${equipo.id}`] = "ER";
              vectorActual[`llegada_${equipo.id}`] = equipo.llegada.toFixed(2);
            } else {
              equipo.estado = "R"; // Rechazado
              vectorActual[`estado_${equipo.id}`] = "R";
              vectorActual[`llegada_${equipo.id}`] = equipo.llegada.toFixed(2);
              vectorActual.equiposRechazados++;
            }
          }

        } else if (proximo === vectorAnterior.finTrabajo1) {
          vectorActual.evento = "fin_trabajo_tec1";
          // Limpiar valores de llegada ya que no es una llegada
          vectorActual.rndLlegada = -1;
          vectorActual.tiempoEntreLlegadas = -1;
          vectorActual.proximaLlegadaTipo = "";
          vectorActual.rndTipoTrabajo = -1;
          vectorActual.trabajo = "";
          vectorActual.rndFinTrabajo = -1;
          vectorActual.tiempoTrabajo = -1;
          
          // Fin trabajo técnico 1
          const equipoFinalizado = vectorAnterior.tecnico1.equipo;
          
          if (equipoFinalizado) {
            if (equipoFinalizado.tipo === "C" && vectorAnterior.retornoTrabajo1 > 0) {
              // Interrupción: técnico sale, equipo queda en proceso
              vectorActual.tecnico1.estado = "libre";
              vectorActual.tecnico1.equipo = null;
              vectorActual.finTrabajo1 = -1;
              // El equipo sigue en interrupción hasta el retorno
              equipoFinalizado.estado = "INT"; // Interrumpido
              vectorActual[`estado_${equipoFinalizado.id}`] = "INT";
            } else {
              // Trabajo normal terminado
              vectorActual.tecnico1.estado = "libre";
              vectorActual.tecnico1.equipo = null;
              vectorActual.finTrabajo1 = -1;
              equipoFinalizado.estado = "T";
              vectorActual[`estado_${equipoFinalizado.id}`] = "T";
              vectorActual.equiposAtendidos++;
              
              // Si era un trabajo C, finalizar la interrupción
              if (equipoFinalizado.tipo === "C") {
                vectorActual.finalizarInterrupcionC(1);
              }
            }
          }

          // Asignar siguiente equipo de la cola
          if (vectorActual.tecnico1.estado === "libre" && vectorActual.colaEspera.length > 0) {
            const siguienteEquipo = vectorActual.colaEspera.shift();
            if (siguienteEquipo) {
              vectorActual.tecnico1.estado = "ocupado";
              vectorActual.tecnico1.equipo = siguienteEquipo;
              siguienteEquipo.estado = "SR";
              siguienteEquipo.tecnico = 1;
              vectorActual[`estado_${siguienteEquipo.id}`] = "SR";

              // Generar RND para fin de trabajo
              const rndFinTrabajo = Math.random();
              vectorActual.rndFinTrabajo = rndFinTrabajo;
              vectorActual.tiempoTrabajo = siguienteEquipo.duracion;

              if (siguienteEquipo.tipo === "C") {
                vectorActual.finTrabajo1 = reloj + 25;
                vectorActual.retornoTrabajo1 = reloj + siguienteEquipo.duracion - 10;
              } else {
                vectorActual.finTrabajo1 = reloj + siguienteEquipo.duracion;
              }
            }
          }

        } else if (proximo === vectorAnterior.finTrabajo2) {
          vectorActual.evento = "fin_trabajo_tec2";
          // Limpiar valores de llegada ya que no es una llegada
          vectorActual.rndLlegada = -1;
          vectorActual.tiempoEntreLlegadas = -1;
          vectorActual.proximaLlegadaTipo = "";
          vectorActual.rndTipoTrabajo = -1;
          vectorActual.trabajo = "";
          vectorActual.rndFinTrabajo = -1;
          vectorActual.tiempoTrabajo = -1;
          
          // Fin trabajo técnico 2
          const equipoFinalizado = vectorAnterior.tecnico2.equipo;
          
          if (equipoFinalizado) {
            if (equipoFinalizado.tipo === "C" && vectorAnterior.retornoTrabajo2 > 0) {
              vectorActual.tecnico2.estado = "libre";
              vectorActual.tecnico2.equipo = null;
              vectorActual.finTrabajo2 = -1;
              // El equipo sigue en interrupción hasta el retorno
              equipoFinalizado.estado = "INT"; // Interrumpido
              vectorActual[`estado_${equipoFinalizado.id}`] = "INT";
            } else {
              vectorActual.tecnico2.estado = "libre";
              vectorActual.tecnico2.equipo = null;
              vectorActual.finTrabajo2 = -1;
              equipoFinalizado.estado = "T";
              vectorActual[`estado_${equipoFinalizado.id}`] = "T";
              vectorActual.equiposAtendidos++;
              
              // Si era un trabajo C, finalizar la interrupción
              if (equipoFinalizado.tipo === "C") {
                vectorActual.finalizarInterrupcionC(2);
              }
            }
          }

          if (vectorActual.tecnico2.estado === "libre" && vectorActual.colaEspera.length > 0) {
            const siguienteEquipo = vectorActual.colaEspera.shift();
            if (siguienteEquipo) {
              vectorActual.tecnico2.estado = "ocupado";
              vectorActual.tecnico2.equipo = siguienteEquipo;
              siguienteEquipo.estado = "SR";
              siguienteEquipo.tecnico = 2;
              vectorActual[`estado_${siguienteEquipo.id}`] = "SR";

              // Generar RND para fin de trabajo
              const rndFinTrabajo = Math.random();
              vectorActual.rndFinTrabajo = rndFinTrabajo;
              vectorActual.tiempoTrabajo = siguienteEquipo.duracion;

              if (siguienteEquipo.tipo === "C") {
                vectorActual.finTrabajo2 = reloj + 25;
                vectorActual.retornoTrabajo2 = reloj + siguienteEquipo.duracion - 10;
              } else {
                vectorActual.finTrabajo2 = reloj + siguienteEquipo.duracion;
              }
            }
          }

        } else if (proximo === vectorAnterior.retornoTrabajo1) {
          vectorActual.evento = "retorno_tec1";
          // Limpiar valores de llegada ya que no es una llegada
          vectorActual.rndLlegada = -1;
          vectorActual.tiempoEntreLlegadas = -1;
          vectorActual.proximaLlegadaTipo = "";
          vectorActual.rndTipoTrabajo = -1;
          vectorActual.trabajo = "";
          vectorActual.rndFinTrabajo = -1;
          vectorActual.tiempoTrabajo = -1;
          
          // Retorno técnico 1 después de interrupción
          vectorActual.retornoTrabajo1 = -1;
          vectorActual.finTrabajo1 = reloj + 10; // Termina en 10 minutos
          
          // Buscar el equipo en interrupción y asignarlo al técnico
          const interrupcion = vectorActual.obtenerInterrupcionPorTecnico(1);
          if (interrupcion) {
            vectorActual.tecnico1.estado = "ocupado";
            vectorActual.tecnico1.equipo = interrupcion.equipo;
            interrupcion.equipo.estado = "SR";
            interrupcion.equipo.tecnico = 1;
          }

        } else if (proximo === vectorAnterior.retornoTrabajo2) {
          vectorActual.evento = "retorno_tec2";
          // Limpiar valores de llegada ya que no es una llegada
          vectorActual.rndLlegada = -1;
          vectorActual.tiempoEntreLlegadas = -1;
          vectorActual.proximaLlegadaTipo = "";
          vectorActual.rndTipoTrabajo = -1;
          vectorActual.trabajo = "";
          vectorActual.rndFinTrabajo = -1;
          vectorActual.tiempoTrabajo = -1;
          
          // Retorno técnico 2 después de interrupción
          vectorActual.retornoTrabajo2 = -1;
          vectorActual.finTrabajo2 = reloj + 10; // Termina en 10 minutos
          
          // Buscar el equipo en interrupción y asignarlo al técnico
          const interrupcion = vectorActual.obtenerInterrupcionPorTecnico(2);
          if (interrupcion) {
            vectorActual.tecnico2.estado = "ocupado";
            vectorActual.tecnico2.equipo = interrupcion.equipo;
            interrupcion.equipo.estado = "SR";
            interrupcion.equipo.tecnico = 2;
          }
        }

        // Guardar referencia a equipos simulados en el vector de estado
        vectorActual.equiposSimulados = equiposSimulados;

        // Actualizar equipos en el vector dinámicamente
        equiposSimulados.forEach((eq, index) => {
          if (eq && eq.llegada !== undefined) {
            // Estado del equipo
            vectorActual[`estado_${index + 1}`] = eq.estado;
            
            // Hora de llegada del equipo
            vectorActual[`llegada_${index + 1}`] = eq.llegada.toFixed(2);
          } else {
            vectorActual[`estado_${index + 1}`] = "";
            vectorActual[`llegada_${index + 1}`] = "";
          }
        });

        // Calcular variables estadísticas
        
        // Calcular ocupación de técnicos de manera acumulativa
        const tiempoTotal = reloj;
        
        // Acumular tiempo de ocupación de técnico 1
        if (vectorActual.tecnico1.estado === "ocupado") {
          if (vectorActual.tiempoInicioOcupacionTec1 === -1) {
            vectorActual.tiempoInicioOcupacionTec1 = reloj;
          }
          vectorActual.usoTecnico1 = vectorAnterior.usoTecnico1 + (reloj - vectorAnterior.reloj);
        } else {
          vectorActual.usoTecnico1 = vectorAnterior.usoTecnico1;
          vectorActual.tiempoInicioOcupacionTec1 = -1;
        }
        
        // Acumular tiempo de ocupación de técnico 2
        if (vectorActual.tecnico2.estado === "ocupado") {
          if (vectorActual.tiempoInicioOcupacionTec2 === -1) {
            vectorActual.tiempoInicioOcupacionTec2 = reloj;
          }
          vectorActual.usoTecnico2 = vectorAnterior.usoTecnico2 + (reloj - vectorAnterior.reloj);
        } else {
          vectorActual.usoTecnico2 = vectorAnterior.usoTecnico2;
          vectorActual.tiempoInicioOcupacionTec2 = -1;
        }
        
        // Calcular porcentajes de ocupación
        vectorActual.porcentajeOcupacionTec1 = tiempoTotal > 0 ? (vectorActual.usoTecnico1 / tiempoTotal) * 100 : 0;
        vectorActual.porcentajeOcupacionTec2 = tiempoTotal > 0 ? (vectorActual.usoTecnico2 / tiempoTotal) * 100 : 0;
        
        // Calcular porcentaje de ocupación de ambos técnicos (promedio)
        vectorActual.porcentajeOcupacionAmbos = (vectorActual.porcentajeOcupacionTec1 + vectorActual.porcentajeOcupacionTec2) / 2;
        
        // Calcular otras estadísticas
        const equiposTerminados = equiposSimulados.filter(eq => eq.estado === "T");
        const equiposRechazados = equiposSimulados.filter(eq => eq.estado === "R");
        
        // Acumulado de permanencia
        if (equiposTerminados.length > 0) {
          const tiempoTotalPermanencia = equiposTerminados
            .reduce((total, eq) => total + (reloj - eq.llegada), 0);
          vectorActual.acumuladoPermanencia = tiempoTotalPermanencia;
          vectorActual.promedioPermanencia = tiempoTotalPermanencia / equiposTerminados.length;
        } else {
          vectorActual.acumuladoPermanencia = 0;
          vectorActual.promedioPermanencia = 0;
        }
        
        // Cantidad de equipos finalizados
        vectorActual.cantidadEquiposFinalizados = equiposTerminados.length;
        
        // Porcentaje de equipos rechazados
        vectorActual.porcentajeRechazados = equiposSimulados.length > 0 ? 
          (equiposRechazados.length / equiposSimulados.length) * 100 : 0;



        // OPTIMIZACIÓN: Solo guardar en memoria las filas del rango solicitado
        if (iteraciones >= desde && iteraciones <= hasta) {
          filasSimulacion.push(vectorActual.toRow());
        }
        
        // OPTIMIZACIÓN: Terminar la simulación si ya tenemos suficientes equipos Y pasamos el rango
        if (iteraciones > hasta && equiposSimulados.length >= cantidadSimulaciones) {
          console.log(`Simulación terminada temprano: ${equiposSimulados.length} equipos, iteración ${iteraciones}`);
          break;
        }
        
        // OPTIMIZACIÓN: Si ya pasamos el rango y tenemos suficientes equipos, saltar procesamiento pesado
        if (iteraciones > hasta && equiposSimulados.length >= cantidadSimulaciones) {
          continue; // Saltar al siguiente ciclo sin procesar eventos
        }
      }
      
      console.log(`Simulación completada. Iteraciones: ${iteraciones}, Equipos: ${equiposSimulados.length}`);
      
      if (iteraciones >= maxIteraciones) {
        console.warn("¡ADVERTENCIA! Se alcanzó el límite máximo de iteraciones");
      }

      // Ya no necesitamos hacer slice porque solo guardamos las filas del rango
      console.log("Filas a mostrar:", filasSimulacion.length);
      setFilas(filasSimulacion);

      // Calcular métricas finales
      const equiposAtendidos = equiposSimulados.filter(eq => eq.estado === "T").length;
      const tiempoTotalPermanencia = equiposSimulados
        .filter(eq => eq.estado === "T")
        .reduce((total, eq) => total + (reloj - eq.llegada), 0);
      const promedioPermanencia = equiposAtendidos > 0 ? tiempoTotalPermanencia / equiposAtendidos : 0;
      const porcentajeRechazados = (vectorActual.equiposRechazados / equiposSimulados.length) * 100;
      const porcentajeOcupacionTec1 = reloj > 0 ? (vectorActual.usoTecnico1 / reloj) * 100 : 0;
      const porcentajeOcupacionTec2 = reloj > 0 ? (vectorActual.usoTecnico2 / reloj) * 100 : 0;
      const porcentajeOcupacionAmbos = (porcentajeOcupacionTec1 + porcentajeOcupacionTec2) / 2;

      console.log("=== RESULTADOS DE LA SIMULACIÓN ===");
      console.log("a) Promedio de permanencia en el laboratorio:", promedioPermanencia.toFixed(2), "minutos");
      console.log("b) Porcentaje de equipos rechazados:", porcentajeRechazados.toFixed(2) + "%");
      console.log("c) Porcentaje de ocupación técnico 1:", porcentajeOcupacionTec1.toFixed(2) + "%");
      console.log("   Porcentaje de ocupación técnico 2:", porcentajeOcupacionTec2.toFixed(2) + "%");
      console.log("   Porcentaje de ocupación ambos técnicos:", porcentajeOcupacionAmbos.toFixed(2) + "%");
      console.log("=====================================");
             } catch (error) {
         console.error("Error en la simulación:", error);
         alert("Error en la simulación: " + error.message);
       } finally {
         setCargando(false);
       }
     }, 100);
  };

  const generarTiempoEntreLlegadas = () => {
    // Distribución uniforme entre 30 y 90 minutos según el problema
    return 30 + Math.random() * (90 - 30);
  };

  const determinarTipoTrabajo = (rnd) => {
    // Probabilidades exactas según el problema
    if (rnd < 0.3) return "A";    // 30%
    if (rnd < 0.6) return "B";    // 30%
    if (rnd < 0.75) return "C";   // 15%
    if (rnd < 0.85) return "D";   // 10%
    return "E";                   // 15%
  };

  const generarTiempoTrabajo = (tipo) => {
    // Distribución uniforme con ±5 minutos de la media según el problema
    const medias = {
      "A": 150, // 2h 30m = 150 min
      "B": 60,  // 1h = 60 min
      "C": 180, // 3h = 180 min
      "D": 60,  // 1h = 60 min
      "E": 30   // 30 min
    };
    const media = medias[tipo] || 60;
    return media - 5 + Math.random() * 10; // Uniforme entre media-5 y media+5
  };

  return (
    <div className="p-4">
      {/* Overlay de carga */}
      {cargando && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow text-xl font-bold animate-pulse">
            Cargando simulación...
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Simulación de Laboratorio de Reparación</h1>
          <p className="mb-4">Sistema de gestión de equipos informáticos</p>
          <div className="bg-white border p-4 inline-block">
            <p className="text-sm">
              <strong>Cátedra:</strong> Simulación<br/>
              <strong>Nombre:</strong> Paulina Tirante
            </p>
          </div>
        </div>

        {/* Tipos de trabajo */}
        <div className="bg-white border p-4">
          <h3 className="font-bold mb-2">Tipos de Trabajo:</h3>
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center text-xs font-bold">A</span>
              <span>Cambio de placa</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-green-500 text-white flex items-center justify-center text-xs font-bold">B</span>
              <span>Ampliación de memoria</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">C</span>
              <span>Formateo de disco</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-purple-500 text-white flex items-center justify-center text-xs font-bold">D</span>
              <span>Agregar CD/DVD</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-red-500 text-white flex items-center justify-center text-xs font-bold">E</span>
              <span>Cambio de memoria</span>
            </div>
          </div>
        </div>

        {/* Controles de simulación */}
        <div className="bg-white border p-4">
          <h3 className="font-bold mb-4">Parámetros de Simulación</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1">Cantidad de simulaciones</label>
              <input 
                type="number" 
                value={cantidadSimulaciones} 
                onChange={e => setCantidadSimulaciones(Math.max(1, +e.target.value))}
                min="1"
                className="w-full border px-2 py-1" 
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Mostrar desde</label>
              <input 
                type="number" 
                value={desde} 
                onChange={e => setDesde(Math.max(0, +e.target.value))}
                min="0"
                className="w-full border px-2 py-1" 
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Hasta</label>
              <input 
                type="number" 
                value={hasta} 
                onChange={e => setHasta(Math.max(desde + 1, +e.target.value))}
                min={desde + 1}
                className="w-full border px-2 py-1" 
              />
            </div>
            <div className="flex items-end">
              <button onClick={simular} className="w-full bg-blue-600 text-white py-2 px-4">Simular</button>
            </div>
          </div>
      </div>

        {/* Resultados */}
      {filas.length > 0 && (
          <div className="overflow-x-auto mt-4 border">
            <table className="w-full border-collapse">
                            <thead>
                {/* Primera fila de encabezados agrupados */}
                <tr className="bg-gray-200">
                  <th rowSpan="2" className="border px-2 py-1 text-center bg-blue-100">Evento</th>
                  <th rowSpan="2" className="border px-2 py-1 text-center bg-blue-100">Reloj</th>
                  
                  {/* LLEGADAS */}
                  <th colSpan="3" className="border px-2 py-1 text-center bg-blue-200">Llegada de equipos</th>
                  
                  {/* TIPO TRABAJO */}
                  <th colSpan="2" className="border px-2 py-1 text-center bg-yellow-200">Tipo trabajo</th>
                  
                  {/* FIN DE TRABAJO */}
                  <th colSpan="4" className="border px-2 py-1 text-center bg-orange-200">Fin de Trabajo</th>
                  
                  {/* TÉCNICOS */}
                  <th colSpan="5" className="border px-2 py-1 text-center bg-gray-200">Técnicos</th>
                  
                  {/* VARIABLES ESTADÍSTICAS */}
                  <th colSpan="7" className="border px-2 py-1 text-center bg-green-200">Variables Estadísticas</th>
                  
                  {/* EQUIPOS - Encabezados individuales */}
                  {Array.from({length: filas.length > 0 ? filas[0].equiposSimulados?.length || 10 : 10}, (_, i) => (
                    <th key={i} colSpan="2" className="border px-2 py-1 text-center bg-purple-200">
                      EQUIPO {i + 1}
                    </th>
                  ))}
                </tr>
                
                {/* Segunda fila de encabezados específicos */}
                <tr className="bg-gray-200">
                  {/* LLEGADAS */}
                  <th className="border px-2 py-1 text-center bg-blue-200">RND</th>
                  <th className="border px-2 py-1 text-center bg-blue-200">Tiempo entre llegadas</th>
                  <th className="border px-2 py-1 text-center bg-blue-200">Próxima llegada</th>
                  
                  {/* TIPO TRABAJO */}
                  <th className="border px-2 py-1 text-center bg-yellow-200">RND</th>
                  <th className="border px-2 py-1 text-center bg-yellow-200">Tipo trabajo</th>
                  
                  {/* FIN DE TRABAJO */}
                  <th className="border px-2 py-1 text-center bg-orange-200">RND</th>
                  <th className="border px-2 py-1 text-center bg-orange-200">Tiempo trabajo</th>
                  <th className="border px-2 py-1 text-center bg-orange-200">Fin trabajo 1</th>
                  <th className="border px-2 py-1 text-center bg-orange-200">Fin trabajo 2</th>
                  
                  {/* TÉCNICOS */}
                  <th className="border px-2 py-1 text-center bg-gray-200">Retorno 1</th>
                  <th className="border px-2 py-1 text-center bg-gray-200">Retorno 2</th>
                  <th className="border px-2 py-1 text-center bg-gray-200">Técnico 1</th>
                  <th className="border px-2 py-1 text-center bg-gray-200">Técnico 2</th>
                  <th className="border px-2 py-1 text-center bg-gray-200">Cola</th>
                  
                  {/* VARIABLES ESTADÍSTICAS */}
                  <th className="border px-2 py-1 text-center bg-green-200">Acumulado permanencia</th>
                  <th className="border px-2 py-1 text-center bg-green-200">Cantidad equipos finalizados</th>
                  <th className="border px-2 py-1 text-center bg-green-200">Promedio permanencia</th>
                  <th className="border px-2 py-1 text-center bg-green-200">% Rechazados</th>
                  <th className="border px-2 py-1 text-center bg-green-200">% Ocupación Tec1</th>
                  <th className="border px-2 py-1 text-center bg-green-200">% Ocupación Tec2</th>
                  <th className="border px-2 py-1 text-center bg-green-200">% Ocupación Ambos</th>
                  
                  {/* EQUIPOS - Sub-columnas */}
                  {Array.from({length: filas.length > 0 ? filas[0].equiposSimulados?.length || 10 : 10}, (_, i) => (
                    <React.Fragment key={i}>
                      <th className="border px-2 py-1 text-center bg-purple-200 min-w-[100px]">
                        estado
                      </th>
                      <th className="border px-2 py-1 text-center bg-purple-200 min-w-[80px]">
                        Hora Ingre
                      </th>
                    </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                    {/* EVENTO */}
                    <td className="border px-2 py-1 text-center">{fila.evento}</td>
                    
                    {/* RELOJ */}
                    <td className="border px-2 py-1 text-center">{fila.reloj}</td>
                    
                    {/* LLEGADAS */}
                    <td className="border px-2 py-1 text-center">{fila.rndLlegada}</td>
                    <td className="border px-2 py-1 text-center">{fila.tiempoEntreLlegadas}</td>
                    <td className="border px-2 py-1 text-center">{fila.proximaLlegada}</td>
                    
                    {/* TIPO TRABAJO */}
                    <td className="border px-2 py-1 text-center">{fila.rndTipoTrabajo}</td>
                    <td className="border px-2 py-1 text-center">{fila.trabajo}</td>
                    
                    {/* FIN DE TRABAJO */}
                    <td className="border px-2 py-1 text-center">{fila.rndFinTrabajo || ""}</td>
                    <td className="border px-2 py-1 text-center">{fila.tiempoTrabajo}</td>
                    <td className="border px-2 py-1 text-center">{fila.finTrabajo1}</td>
                    <td className="border px-2 py-1 text-center">{fila.finTrabajo2}</td>
                    
                    {/* TÉCNICOS */}
                    <td className="border px-2 py-1 text-center">{fila.retornoTrabajo1}</td>
                    <td className="border px-2 py-1 text-center">{fila.retornoTrabajo2}</td>
                    <td className="border px-2 py-1 text-center">{fila.tecnico1}</td>
                    <td className="border px-2 py-1 text-center">{fila.tecnico2}</td>
                    <td className="border px-2 py-1 text-center">{fila.cola}</td>
                    
                    {/* VARIABLES ESTADÍSTICAS */}
                    <td className="border px-2 py-1 text-center">{fila.acumuladoPermanencia}</td>
                    <td className="border px-2 py-1 text-center">{fila.cantidadEquiposFinalizados}</td>
                    <td className="border px-2 py-1 text-center">{fila.promedioPermanencia}</td>
                    <td className="border px-2 py-1 text-center">{fila.porcentajeRechazados}</td>
                    <td className="border px-2 py-1 text-center">{fila.porcentajeOcupacionTec1}</td>
                    <td className="border px-2 py-1 text-center">{fila.porcentajeOcupacionTec2}</td>
                    <td className="border px-2 py-1 text-center">{fila.porcentajeOcupacionAmbos}</td>
                    
                    {/* EQUIPOS */}
                    {Array.from({length: filas.length > 0 ? filas[0].equiposSimulados?.length || 10 : 10}, (_, i) => (
                      <React.Fragment key={i}>
                        <td className="border px-2 py-1 text-center">
                          {fila[`estado_${i + 1}`] || ""}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {fila[`llegada_${i + 1}`] || ""}
                        </td>
                      </React.Fragment>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
};

export default SimulacionLaboratorio;
