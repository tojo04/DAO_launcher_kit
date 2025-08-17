import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Asset {
  'id' : AssetId,
  'daoId' : Principal,
  'contentType' : string,
  'data' : AssetData,
  'name' : string,
  'size' : bigint,
  'tags' : Array<string>,
  'isPublic' : boolean,
  'uploadedAt' : Time,
  'uploadedBy' : Principal,
}
export type AssetData = Uint8Array | number[];
export type AssetId = bigint;
export interface AssetMetadata {
  'id' : AssetId,
  'daoId' : Principal,
  'name' : string,
  'contentType' : string,
  'size' : bigint,
  'uploadedBy' : Principal,
  'uploadedAt' : Time,
  'isPublic' : boolean,
  'tags' : Array<string>,
}
export type Result = { 'ok' : AssetId } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : Asset } |
  { 'err' : string };
export type Time = bigint;
export interface _SERVICE {
  'addAuthorizedUploader' : ActorMethod<[Principal], Result_1>,
  'batchUploadAssets' : ActorMethod<
    [Principal, Array<[string, string, AssetData, boolean, Array<string>]>],
    Array<Result>
  >,
  'deleteAsset' : ActorMethod<[Principal, AssetId], Result_1>,
  'getAsset' : ActorMethod<[Principal, AssetId], Result_2>,
  'getAssetByName' : ActorMethod<[Principal, string], [] | [AssetMetadata]>,
  'getAssetMetadata' : ActorMethod<[Principal, AssetId], [] | [AssetMetadata]>,
  'getAuthorizedUploaders' : ActorMethod<[], Array<Principal>>,
  'getPublicAssets' : ActorMethod<[Principal], Array<AssetMetadata>>,
  'getStorageStats' : ActorMethod<
    [Principal],
    {
      'storageLimit' : bigint,
      'totalAssets' : bigint,
      'storageAvailable' : bigint,
      'storageUsed' : bigint,
      'averageFileSize' : bigint,
    }
  >,
  'getSupportedContentTypes' : ActorMethod<[], Array<string>>,
  'getUserAssets' : ActorMethod<[Principal], Array<AssetMetadata>>,
  'health' : ActorMethod<
    [],
    { 'status' : string, 'storageUsed' : bigint, 'timestamp' : Time }
  >,
  'init' : ActorMethod<[[] | [Principal], boolean], undefined>,
  'removeAuthorizedUploader' : ActorMethod<[Principal], Result_1>,
  'searchAssetsByTag' : ActorMethod<[Principal, string], Array<AssetMetadata>>,
  'updateAssetMetadata' : ActorMethod<
    [
      Principal,
      AssetId,
      [] | [string],
      [] | [boolean],
      [] | [Array<string>]
    ],
    Result_1
  >,
  'updateStorageLimits' : ActorMethod<[[] | [bigint], [] | [bigint]], Result_1>,
  'uploadAsset' : ActorMethod<
    [Principal, string, string, AssetData, boolean, Array<string>],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
