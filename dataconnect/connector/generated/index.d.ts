import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface BingoCard_Key {
  id: UUIDString;
  __typename?: 'BingoCard_Key';
}

export interface CalledItem_Key {
  id: UUIDString;
  __typename?: 'CalledItem_Key';
}

export interface CardItem_Key {
  id: UUIDString;
  __typename?: 'CardItem_Key';
}

export interface GameSession_Key {
  id: UUIDString;
  __typename?: 'GameSession_Key';
}

export interface GetBingoCardData {
  bingoCard?: {
    id: UUIDString;
    title: string;
    theme?: string | null;
  } & BingoCard_Key;
}

export interface GetBingoCardVariables {
  id: UUIDString;
}

export interface ListUsersData {
  users: ({
    displayName: string;
    email?: string | null;
  })[];
}

export interface SeedDataData {
  user_insertMany: User_Key[];
}

export interface SessionPlayer_Key {
  id: UUIDString;
  __typename?: 'SessionPlayer_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface SeedDataRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<SeedDataData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<SeedDataData, undefined>;
  operationName: string;
}
export const seedDataRef: SeedDataRef;

export function seedData(): MutationPromise<SeedDataData, undefined>;
export function seedData(dc: DataConnect): MutationPromise<SeedDataData, undefined>;

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect): QueryPromise<ListUsersData, undefined>;

interface GetBingoCardRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBingoCardVariables): QueryRef<GetBingoCardData, GetBingoCardVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBingoCardVariables): QueryRef<GetBingoCardData, GetBingoCardVariables>;
  operationName: string;
}
export const getBingoCardRef: GetBingoCardRef;

export function getBingoCard(vars: GetBingoCardVariables): QueryPromise<GetBingoCardData, GetBingoCardVariables>;
export function getBingoCard(dc: DataConnect, vars: GetBingoCardVariables): QueryPromise<GetBingoCardData, GetBingoCardVariables>;

