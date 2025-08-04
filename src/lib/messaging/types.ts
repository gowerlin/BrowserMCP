/**
 * Message system type definitions
 */

export type MessageType<T> = keyof T;

export type MessagePayload<TMap, TType extends MessageType<TMap>> = 
  TMap[TType] extends { payload: infer P } ? P : never;

export interface BaseMessage<TType = string, TPayload = any> {
  type: TType;
  payload: TPayload;
  id?: string;
  timestamp?: number;
}

export interface MessageResponse<TResult = any> {
  id: string;
  result?: TResult;
  error?: string;
}