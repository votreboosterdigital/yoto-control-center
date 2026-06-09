/** Types génériques partagés entre domaines */

export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E }

export type AsyncResult<T, E = string> = Promise<Result<T, E>>
