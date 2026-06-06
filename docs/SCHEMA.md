# Esquema de la base de datos · Aula Vocational Lab

> Última actualización: 2026-06-06
> Plataforma: Supabase (Postgres + Auth + Storage)

## Para qué sirve este documento

Este archivo describe **cómo se organiza la información del aula** en la base de datos. Está pensado para que cualquiera del equipo (técnico o no) entienda de qué se trata cada tabla y por qué.

Es la **fuente de verdad**: si más adelante hay que agregar una tabla nueva o un campo, primero lo discutimos acá y después lo aplicamos a Supabase.

## Resumen visual de las tablas

```
profiles          → datos extra de cada usuario (alumno, profe, admin)
   ↓
inscripciones     → en qué cursos está cada alumno
   ↑↓
cursos            → los cursos publicados
   ↓
modulos           → los bloques dentro de cada curso
   ↓
archivos_modulo   → PDFs, videos, audios subidos por el profe
tareas            → consignas dentro de un módulo
   ↓
entregas          → lo que sube el alumno + devolución del profe

transferencias    → bandeja de pagos para que admin confirme
```

## Cómo funciona la autenticación

Supabase ya provee una tabla interna `auth.users` que maneja login, contraseñas, etc. **No la tocamos.** Lo que sumamos nosotros es una tabla `profiles` con un campo `rol` (alumno / profe / admin) y datos visibles (nombre, etc.) que se conecta 1-a-1 con `auth.users`.

Cuando alguien se loguea, Supabase nos da su `auth.users.id`; con ese id vamos a `profiles` para saber qué rol tiene y qué puede ver.

---

## Tabla por tabla

### 1. `profiles` — perfil de cada usuario del aula

| Campo            | Tipo         | Descripción                                            |
| ---------------- | ------------ | ------------------------------------------------------ |
| `id`             | uuid (PK)    | Mismo id que `auth.users.id` — los conecta 1-a-1.      |
| `nombre`         | text         | Nombre y apellido para mostrar.                        |
| `rol`            | text         | `alumno`, `profe` o `admin`.                           |
| `avatar_url`     | text         | Opcional. URL de la foto de perfil.                    |
| `creado_en`      | timestamptz  | Cuándo se dio de alta.                                 |

**Reglas de acceso (RLS):**
- Cualquier usuario logueado puede ver su propio perfil.
- Solo el `admin` puede ver y modificar el perfil de otros.

---

### 2. `cursos` — los cursos del aula

| Campo         | Tipo         | Descripción                                                  |
| ------------- | ------------ | ------------------------------------------------------------ |
| `id`          | uuid (PK)    | Identificador único.                                         |
| `slug`        | text (único) | Texto corto para la URL: `coaching-vocacional-agosto-2026`.  |
| `titulo`      | text         | Nombre del curso.                                            |
| `resumen`     | text         | Bajada corta para mostrar en la card.                        |
| `periodo`     | text         | Texto libre: "Agosto – Octubre 2026".                        |
| `publicado`   | boolean      | Si está visible para alumnos o todavía en borrador.          |
| `creado_en`   | timestamptz  | Cuándo se creó.                                              |

**Reglas de acceso:**
- Los **alumnos** ven solo cursos en los que están inscriptos (vía `inscripciones`).
- Los **profes** ven solo los cursos que enseñan (vía tabla `cursos_profesores`, ver abajo).
- El **admin** ve todos.

---

### 3. `cursos_profesores` — relación curso ↔ profe

Tabla "puente" para que un curso pueda tener uno o más profes (ej: Julia + Laura).

| Campo         | Tipo         | Descripción                                            |
| ------------- | ------------ | ------------------------------------------------------ |
| `curso_id`    | uuid (FK)    | A qué curso.                                           |
| `profesor_id` | uuid (FK)    | Qué profesor (apunta a `profiles.id` con `rol=profe`). |

La combinación (curso_id, profesor_id) es la clave primaria.

---

### 4. `modulos` — bloques dentro de un curso

| Campo         | Tipo         | Descripción                                                |
| ------------- | ------------ | ---------------------------------------------------------- |
| `id`          | uuid (PK)    | Identificador único.                                       |
| `curso_id`    | uuid (FK)    | A qué curso pertenece.                                     |
| `numero`      | int          | Orden dentro del curso (1, 2, 3...).                       |
| `titulo`      | text         | Nombre del módulo.                                         |
| `descripcion` | text         | Bajada del módulo.                                         |
| `creado_en`   | timestamptz  | Cuándo se creó.                                            |

**Reglas:** mismas que el curso al que pertenecen.

---

### 5. `archivos_modulo` — material descargable

| Campo         | Tipo         | Descripción                                                |
| ------------- | ------------ | ---------------------------------------------------------- |
| `id`          | uuid (PK)    | Identificador único.                                       |
| `modulo_id`   | uuid (FK)    | A qué módulo pertenece.                                    |
| `nombre`      | text         | Cómo lo ve el alumno: "Manual del programa.pdf".           |
| `tipo`        | text         | `pdf`, `video`, `audio` o `link`. Sólo afecta el ícono.    |
| `storage_path`| text         | Ruta del archivo en Supabase Storage.                      |
| `peso_kb`     | int          | Tamaño aproximado para mostrar.                            |
| `creado_en`   | timestamptz  | Cuándo se subió.                                           |

**Reglas:** lo mismo que el módulo.

---

### 6. `tareas` — consignas a entregar

| Campo            | Tipo         | Descripción                                              |
| ---------------- | ------------ | -------------------------------------------------------- |
| `id`             | uuid (PK)    | Identificador único.                                     |
| `modulo_id`      | uuid (FK)    | A qué módulo pertenece (un módulo tiene 0 o 1 tarea).    |
| `titulo`         | text         | Nombre de la tarea.                                      |
| `consigna`       | text         | Texto completo de la consigna.                           |
| `fecha_entrega`  | date         | Fecha límite.                                            |
| `creado_en`      | timestamptz  | Cuándo se creó.                                          |

**Reglas:** lo mismo que el módulo.

---

### 7. `inscripciones` — qué alumno está en qué curso

| Campo          | Tipo         | Descripción                                              |
| -------------- | ------------ | -------------------------------------------------------- |
| `id`           | uuid (PK)    | Identificador único.                                     |
| `alumno_id`    | uuid (FK)    | A `profiles.id` (con `rol=alumno`).                      |
| `curso_id`     | uuid (FK)    | A `cursos.id`.                                           |
| `inscripto_en` | timestamptz  | Cuándo se inscribió.                                     |
| `activo`       | boolean      | `true` cuando admin confirmó el pago.                    |

**Reglas:**
- El alumno ve solo las inscripciones donde aparece él.
- El admin ve y modifica todas.
- Cuando se confirma una `transferencia`, se setea `activo = true`.

---

### 8. `entregas` — lo que el alumno sube + devolución del profe

| Campo            | Tipo         | Descripción                                              |
| ---------------- | ------------ | -------------------------------------------------------- |
| `id`             | uuid (PK)    | Identificador único.                                     |
| `tarea_id`       | uuid (FK)    | A qué tarea responde.                                    |
| `alumno_id`      | uuid (FK)    | Quién la entregó.                                        |
| `storage_path`   | text         | Ruta del archivo subido en Supabase Storage.             |
| `archivo_nombre` | text         | Cómo lo subió: "mapa-fortalezas-sofia.pdf".              |
| `enviada_en`     | timestamptz  | Cuándo la subió el alumno.                               |
| `nota`           | text         | Devolución del profe (opcional hasta corrección).        |
| `comentario`     | text         | Comentario del profe (opcional).                         |
| `corregida_en`   | timestamptz  | Cuándo se corrigió (opcional).                           |
| `corregida_por`  | uuid (FK)    | Profe que corrigió (a `profiles.id`).                    |

**Reglas:**
- El **alumno** ve sus propias entregas. Puede crear nuevas y editar mientras no estén corregidas.
- El **profe** ve las entregas de los cursos que enseña.
- El **admin** ve todo.

---

### 9. `transferencias` — bandeja de pagos para confirmar

| Campo            | Tipo         | Descripción                                              |
| ---------------- | ------------ | -------------------------------------------------------- |
| `id`             | uuid (PK)    | Identificador único.                                     |
| `alumno_nombre`  | text         | Nombre que aparece en la transferencia (texto libre).    |
| `alumno_email`   | text         | Mail con el que va a quedar registrado.                  |
| `monto`          | text         | Monto (texto libre por ahora — ej "$ 95.000").           |
| `curso_id`       | uuid (FK)    | A qué curso quiere inscribirse.                          |
| `recibida_en`    | date         | Fecha de la transferencia.                               |
| `estado`         | text         | `pendiente` o `confirmada`.                              |
| `confirmada_por` | uuid (FK)    | Admin que confirmó (opcional).                           |
| `confirmada_en`  | timestamptz  | Cuándo se confirmó (opcional).                           |

**Reglas:** solo admin.

**Flujo:**
1. Admin carga manualmente una transferencia cuando llega el dinero.
2. Admin la confirma → automáticamente se crea el usuario en `auth.users` + un `profile` con rol `alumno` + una `inscripcion` activa en el curso correspondiente.

---

### 10. `solicitudes_inscripcion` — entrada del embudo (pre-pago)

Capta a quien llena el form público de `/inscripcion` (o el form web simplificado con otra intención). Es la tabla del embudo: vive **antes** del pago. Cuando una solicitud se concreta como pago, el admin crea la `transferencia` correspondiente.

| Campo                  | Tipo         | Descripción                                                                  |
| ---------------------- | ------------ | ---------------------------------------------------------------------------- |
| `id`                   | uuid (PK)    | Identificador único.                                                         |
| `creado_en`            | timestamptz  | Cuándo se envió la solicitud.                                                |
| `canal`                | text         | `web`, `whatsapp`, `instagram` u `otro`. Se setea por query param.           |
| `intencion`            | text         | `info` / `inscripcion`. (`charla` está permitido en la DB pero el form ya no lo emite — deprecado 2026-06-03.) |
| `nombre`               | text         | Nombre de quien completa el form.                                            |
| `email`                | text         | Mail de contacto.                                                            |
| `telefono`             | text         | Opcional.                                                                    |
| `pais`                 | text         | Opcional.                                                                    |
| `como_nos_encontraste` | text         | Opcional.                                                                    |
| `canal_preferido_respuesta` | text    | `mail` o `whatsapp`. Cómo prefiere el inscripto ser contactado. Si es `whatsapp`, el teléfono es obligatorio. |
| `rol_solicitante`      | text         | `mayor` o `responsable_menor`. Obligatorio si `intencion = 'inscripcion'`.   |
| `edad`                 | int          | Edad del participante mayor. Obligatoria si `rol_solicitante = 'mayor'`.     |
| `nombre_menor`         | text         | Obligatorio si `rol_solicitante = 'responsable_menor'`.                      |
| `fecha_nacimiento_menor` | date       | Fecha de nacimiento del menor. Obligatoria si `rol_solicitante = 'responsable_menor'`. |
| `vinculo_menor`        | text         | Vínculo del tutor con el menor. Obligatorio si `rol_solicitante = 'responsable_menor'`. |
| `dni_tutor`            | text         | DNI/documento del representante legal. Obligatorio si `rol_solicitante = 'responsable_menor'`. |
| `edad_menor`           | int          | _Deprecado_ — reemplazado por `fecha_nacimiento_menor`. El form ya no lo escribe. |
| `contacto_emergencia_nombre` | text   | Contacto de emergencia. Obligatorio para `mayor`; opcional (adicional) para menores. |
| `contacto_emergencia_telefono` | text | Teléfono del contacto de emergencia.                                        |
| `contacto_emergencia_vinculo` | text  | Vínculo del contacto de emergencia con el participante.                      |
| `protocolo_aceptado`   | boolean      | Tiene que ser `true` si `intencion = 'inscripcion'`.                         |
| `protocolo_version`    | text         | Versión del PDF aceptado (ej `protocolo-v1.pdf`).                            |
| `protocolo_aceptado_en`| timestamptz  | Momento exacto de la aceptación.                                             |
| `user_agent`           | text         | Browser/dispositivo desde el que se firmó (para evidencia probatoria).       |
| `estado`               | text         | `nueva` / `contactada` / `convertida` / `descartada`. Default `nueva`.       |
| `curso_id`             | uuid (FK)    | A qué curso quiere anotarse (opcional).                                      |
| `notas_admin`          | text         | Notas internas del admin (opcional).                                         |

**Reglas RLS:**
- **INSERT abierto** — anónimos y logueados pueden crear solicitudes. Esto es lo que permite que el form público funcione sin login.
- **SELECT / UPDATE / DELETE solo admin.**

**Constraint de coherencia:** si `intencion = 'inscripcion'`, los campos de protocolo y `rol_solicitante` son obligatorios. Si `rol_solicitante = 'responsable_menor'`, además `nombre_menor` es obligatorio. La base rechaza inserts incoherentes.

**Constraint del consentimiento** (`solicitudes_datos_consentimiento`, migración 06): si `intencion = 'inscripcion'`, según el rol se exigen los datos que pide el protocolo legal — para `mayor`: `edad` (≥18) + contacto de emergencia completo; para `responsable_menor`: `fecha_nacimiento_menor` + `vinculo_menor` + `dni_tutor`. El contacto de emergencia es opcional para menores (el tutor ya es el principal).

**Flujo:**
1. Alguien entra a `/inscripcion` (o al form web), elige intención, completa datos.
2. Si la intención es `inscripcion`, marca el checkbox del protocolo. Se guarda `protocolo_version`, `protocolo_aceptado_en` y `user_agent`.
3. INSERT en esta tabla → estado queda `nueva`.
4. Admin la ve en su panel, contacta, marca como `contactada`.
5. Si paga, el admin pasa los datos a `transferencias` y marca esta solicitud como `convertida`.

---

## Storage (archivos)

Supabase tiene un sistema de "buckets" (carpetas) para guardar archivos. Vamos a crear tres:

- **`material-cursos`** — privado. Acá viven los PDFs, videos y audios que sube el profe (los `archivos_modulo`).
- **`entregas-alumnos`** — privado. Acá viven los archivos que suben los alumnos al entregar tareas.
- **`protocolos`** — **público para lectura**. Acá viven las versiones del PDF del protocolo de consentimiento informado (`protocolo-v1.pdf`, `protocolo-v2.pdf`, etc.). Lectura pública porque el link tiene que ser abrible desde el form sin login. Subir y borrar sigue siendo solo admin.

Las reglas de quién puede subir / descargar de cada bucket replican las reglas de las tablas.

---

## Lo que NO entra en Fase 1

Estas tablas las pensamos para más adelante (Fase 2). Por ahora **no las creamos** todavía:

- `foros_mensajes` — foros de discusión por curso.
- `mensajes` — mensajería privada profe ↔ alumno.
- `notificaciones` — qué tiene cada usuario por leer.
- `anuncios` — tablón del curso.
- `eventos_calendario` — fechas de entrega y encuentros sincrónicos.

Cuando lleguemos a Fase 2, este mismo archivo se actualiza con esas tablas.

---

## Próximo paso

Cuando este esquema esté revisado y aprobado, el siguiente paso es:

1. Crear el proyecto en Supabase.
2. Ejecutar el SQL que crea todas estas tablas + RLS + buckets.
3. Cargar datos de prueba para verificar que todo funciona.

El SQL lo escribe Claude en una segunda pasada, una vez que esté validado este esquema.
