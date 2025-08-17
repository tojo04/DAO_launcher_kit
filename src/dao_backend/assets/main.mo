import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat32 "mo:base/Nat32";

import Types "../shared/types";

persistent actor AssetCanister {
    type Result<T, E> = Result.Result<T, E>;
    type Time = Time.Time;

    // Asset types
    public type AssetId = Nat;
    public type DaoId = Types.DAOId;
    public type AssetData = Blob;

    public type AssetKey = {
        daoId: DaoId;
        assetId: AssetId;
    };

    public type Asset = {
        id: AssetId;
        daoId: DaoId;
        name: Text;
        contentType: Text;
        size: Nat;
        data: AssetData;
        uploadedBy: Principal;
        uploadedAt: Time;
        isPublic: Bool;
        tags: [Text];
    };

    public type AssetMetadata = {
        id: AssetId;
        daoId: DaoId;
        name: Text;
        contentType: Text;
        size: Nat;
        uploadedBy: Principal;
        uploadedAt: Time;
        isPublic: Bool;
        tags: [Text];
    };

    public type AssetError = {
        #notFound;
        #notAuthorized;
        #invalidInput;
        #storageFull;
        #fileTooLarge;
        #unsupportedFormat;
    };

    // Stable storage for upgrades
    private var nextAssetId : Nat = 1;
    private var assetsEntries : [(AssetKey, Asset)] = [];
    private var authorizedUploaders : [Principal] = [];
    private var maxFileSize : Nat = 10_000_000; // 10MB default
    private var maxTotalStorage : Nat = 1_000_000_000; // 1GB default
    private var currentStorageUsed : Nat = 0;
    private var allowOpenUploads : Bool = false; // permit uploads with empty authorizedUploaders

    // Runtime storage
    private func assetKeyEqual(a: AssetKey, b: AssetKey) : Bool {
        Text.equal(a.daoId, b.daoId) and a.assetId == b.assetId
    };

    private func assetKeyHash(k: AssetKey) : Nat32 {
        Nat32.xor(Text.hash(k.daoId), Nat32.fromNat(k.assetId))
    };

    private type UploaderKey = {
        daoId: DaoId;
        uploader: Principal;
    };

    private func uploaderKeyEqual(a: UploaderKey, b: UploaderKey) : Bool {
        Text.equal(a.daoId, b.daoId) and a.uploader == b.uploader
    };

    private func uploaderKeyHash(k: UploaderKey) : Nat32 {
        Nat32.xor(Text.hash(k.daoId), Principal.hash(k.uploader))
    };

    private transient var assets = HashMap.HashMap<AssetKey, Asset>(100, assetKeyEqual, assetKeyHash);
    private transient var uploaderAssets = HashMap.HashMap<UploaderKey, [AssetId]>(50, uploaderKeyEqual, uploaderKeyHash);

    // Supported content types
    private transient let supportedTypes = [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        "application/pdf", "text/plain", "text/html", "text/css", "text/javascript",
        "application/json", "application/xml", "video/mp4", "audio/mpeg", "audio/wav"
    ];

    // System functions for upgrades and initialization

    // During installation the deployer can optionally supply an initial
    // principal that is immediately granted upload permissions. The deployer
    // can also enable `allowOpenUploads` to permit anyone to upload assets
    // when no authorized uploaders are configured. By default open uploads are
    // disabled, meaning attempts to upload assets will be rejected until at
    // least one uploader has been authorized. If omitted, the list of
    // authorized uploaders starts empty and can be populated later via
    // `addAuthorizedUploader`.
    public shared ({caller = _}) func init(initialUploader : ?Principal, openUploads : Bool) : async () {
        switch (initialUploader) {
            case (?p) { authorizedUploaders := [p] };
            case null {};
        };
        allowOpenUploads := openUploads;
    };

    system func preupgrade() {
        assetsEntries := Iter.toArray(assets.entries());
    };

    system func postupgrade() {
        assets := HashMap.fromIter<AssetKey, Asset>(
            assetsEntries.vals(),
            assetsEntries.size(),
            assetKeyEqual,
            assetKeyHash
        );

        // Rebuild uploader assets mapping
        for ((key, asset) in assets.entries()) {
            let uKey : UploaderKey = { daoId = key.daoId; uploader = asset.uploadedBy };
            let currentAssets = switch (uploaderAssets.get(uKey)) {
                case (?assets) assets;
                case null [];
            };
            let updatedAssets = Array.append<AssetId>(currentAssets, [key.assetId]);
            uploaderAssets.put(uKey, updatedAssets);
        };
    };

    // Public functions

    // Upload an asset.
    // If no uploaders have been authorized, the upload will be rejected unless
    // `allowOpenUploads` was set to true during deployment.
    public shared(msg) func uploadAsset(
        daoId: DaoId,
        name: Text,
        contentType: Text,
        data: AssetData,
        isPublic: Bool,
        tags: [Text]
    ) : async Result<AssetId, Text> {
        let caller = msg.caller;
        if (authorizedUploaders.size() == 0) {
            if (not allowOpenUploads) {
                return #err("Uploads are disabled until an uploader is authorized or open uploads are enabled");
            };
        } else if (not isAuthorized(caller)) {
            return #err("Not authorized to upload assets");
        };
        let dataSize = data.size();

        // Validate input
        if (name == "") {
            return #err("Asset name cannot be empty");
        };

        if (dataSize == 0) {
            return #err("Asset data cannot be empty");
        };

        if (dataSize > maxFileSize) {
            return #err("File size exceeds maximum allowed size");
        };

        if (currentStorageUsed + dataSize > maxTotalStorage) {
            return #err("Storage limit exceeded");
        };

        // Check if content type is supported
        let isSupported = Array.find<Text>(supportedTypes, func(t) = t == contentType);
        if (isSupported == null) {
            return #err("Unsupported content type: " # contentType);
        };

        let assetId = nextAssetId;
        nextAssetId += 1;

        let key : AssetKey = { daoId = daoId; assetId = assetId };
        let asset : Asset = {
            id = assetId;
            daoId = daoId;
            name = name;
            contentType = contentType;
            size = dataSize;
            data = data;
            uploadedBy = caller;
            uploadedAt = Time.now();
            isPublic = isPublic;
            tags = tags;
        };

        assets.put(key, asset);
        currentStorageUsed += dataSize;

        // Update uploader assets mapping
        let uKey : UploaderKey = { daoId = daoId; uploader = caller };
        let currentAssets = switch (uploaderAssets.get(uKey)) {
            case (?assets) assets;
            case null [];
        };
        let updatedAssets = Array.append<AssetId>(currentAssets, [assetId]);
        uploaderAssets.put(uKey, updatedAssets);

        Debug.print("Asset uploaded: " # name # " (ID: " # Nat.toText(assetId) # ")");
        #ok(assetId)
    };

    // Get asset data
    public shared(msg) func getAsset(daoId: DaoId, assetId: AssetId) : async Result<Asset, Text> {
        let caller = msg.caller;
        let key : AssetKey = { daoId = daoId; assetId = assetId };

        switch (assets.get(key)) {
            case (?asset) {
                // Check access permissions
                if (asset.isPublic or asset.uploadedBy == caller or isAuthorized(caller)) {
                    #ok(asset)
                } else {
                    #err("Not authorized to access this asset")
                }
            };
            case null #err("Asset not found");
        }
    };

    // Get asset metadata only (without data)
    public query func getAssetMetadata(daoId: DaoId, assetId: AssetId) : async ?AssetMetadata {
        let key : AssetKey = { daoId = daoId; assetId = assetId };
        switch (assets.get(key)) {
            case (?asset) {
                ?{
                    id = asset.id;
                    daoId = asset.daoId;
                    name = asset.name;
                    contentType = asset.contentType;
                    size = asset.size;
                    uploadedBy = asset.uploadedBy;
                    uploadedAt = asset.uploadedAt;
                    isPublic = asset.isPublic;
                    tags = asset.tags;
                }
            };
            case null null;
        }
    };

    // Get public assets
    public query func getPublicAssets(daoId: DaoId) : async [AssetMetadata] {
        let publicAssets = Buffer.Buffer<AssetMetadata>(0);
        for ((key, asset) in assets.entries()) {
            if (Text.equal(key.daoId, daoId) and asset.isPublic) {
                publicAssets.add({
                    id = asset.id;
                    daoId = asset.daoId;
                    name = asset.name;
                    contentType = asset.contentType;
                    size = asset.size;
                    uploadedBy = asset.uploadedBy;
                    uploadedAt = asset.uploadedAt;
                    isPublic = asset.isPublic;
                    tags = asset.tags;
                });
            };
        };
        Buffer.toArray(publicAssets)
    };

    // Get user's assets
    public shared(msg) func getUserAssets(daoId: DaoId) : async [AssetMetadata] {
        let caller = msg.caller;
        let uKey : UploaderKey = { daoId = daoId; uploader = caller };
        let userAssetIds = switch (uploaderAssets.get(uKey)) {
            case (?ids) ids;
            case null return [];
        };

        let userAssets = Buffer.Buffer<AssetMetadata>(0);
        for (assetId in userAssetIds.vals()) {
            let key : AssetKey = { daoId = daoId; assetId = assetId };
            switch (assets.get(key)) {
                case (?asset) {
                    userAssets.add({
                        id = asset.id;
                        daoId = asset.daoId;
                        name = asset.name;
                        contentType = asset.contentType;
                        size = asset.size;
                        uploadedBy = asset.uploadedBy;
                        uploadedAt = asset.uploadedAt;
                        isPublic = asset.isPublic;
                        tags = asset.tags;
                    });
                };
                case null {};
            };
        };
        Buffer.toArray(userAssets)
    };

    // Search assets by tags
    public query func searchAssetsByTag(daoId: DaoId, tag: Text) : async [AssetMetadata] {
        let matchingAssets = Buffer.Buffer<AssetMetadata>(0);
        for ((key, asset) in assets.entries()) {
            if (Text.equal(key.daoId, daoId) and asset.isPublic) {
                let hasTag = Array.find<Text>(asset.tags, func(t) = t == tag);
                if (hasTag != null) {
                    matchingAssets.add({
                        id = asset.id;
                        daoId = asset.daoId;
                        name = asset.name;
                        contentType = asset.contentType;
                        size = asset.size;
                        uploadedBy = asset.uploadedBy;
                        uploadedAt = asset.uploadedAt;
                        isPublic = asset.isPublic;
                        tags = asset.tags;
                    });
                };
            };
        };
        Buffer.toArray(matchingAssets)
    };

    // Delete asset
    public shared(msg) func deleteAsset(daoId: DaoId, assetId: AssetId) : async Result<(), Text> {
        let caller = msg.caller;
        let key : AssetKey = { daoId = daoId; assetId = assetId };

        switch (assets.get(key)) {
            case (?asset) {
                // Check if user owns the asset or is authorized
                if (asset.uploadedBy == caller or isAuthorized(caller)) {
                    assets.delete(key);
                    currentStorageUsed -= asset.size;

                    // Update uploader assets mapping
                    let uKey : UploaderKey = { daoId = daoId; uploader = asset.uploadedBy };
                    let currentAssets = switch (uploaderAssets.get(uKey)) {
                        case (?assets) assets;
                        case null [];
                    };
                    let updatedAssets = Array.filter<AssetId>(currentAssets, func(id) = id != assetId);
                    uploaderAssets.put(uKey, updatedAssets);

                    Debug.print("Asset deleted: " # asset.name # " (ID: " # Nat.toText(assetId) # ")");
                    #ok()
                } else {
                    #err("Not authorized to delete this asset")
                }
            };
            case null #err("Asset not found");
        }
    };

    // Update asset metadata
    public shared(msg) func updateAssetMetadata(
        daoId: DaoId,
        assetId: AssetId,
        name: ?Text,
        isPublic: ?Bool,
        tags: ?[Text]
    ) : async Result<(), Text> {
        let caller = msg.caller;
        let key : AssetKey = { daoId = daoId; assetId = assetId };

        switch (assets.get(key)) {
            case (?asset) {
                if (asset.uploadedBy == caller or isAuthorized(caller)) {
                    let updatedAsset = {
                        id = asset.id;
                        daoId = asset.daoId;
                        name = switch (name) { case (?n) n; case null asset.name };
                        contentType = asset.contentType;
                        size = asset.size;
                        data = asset.data;
                        uploadedBy = asset.uploadedBy;
                        uploadedAt = asset.uploadedAt;
                        isPublic = switch (isPublic) { case (?p) p; case null asset.isPublic };
                        tags = switch (tags) { case (?t) t; case null asset.tags };
                    };
                    assets.put(key, updatedAsset);
                    #ok()
                } else {
                    #err("Not authorized to update this asset")
                }
            };
            case null #err("Asset not found");
        }
    };

    // Get storage statistics
    public query func getStorageStats(daoId: DaoId) : async {
        totalAssets: Nat;
        storageUsed: Nat;
        storageLimit: Nat;
        storageAvailable: Nat;
        averageFileSize: Nat;
    } {
        var totalAssets : Nat = 0;
        var daoStorage : Nat = 0;
        for ((key, asset) in assets.entries()) {
            if (Text.equal(key.daoId, daoId)) {
                totalAssets += 1;
                daoStorage += asset.size;
            };
        };
        let averageSize = if (totalAssets > 0) {
            daoStorage / totalAssets
        } else { 0 };

        {
            totalAssets = totalAssets;
            storageUsed = daoStorage;
            storageLimit = maxTotalStorage;
            storageAvailable = maxTotalStorage - currentStorageUsed;
            averageFileSize = averageSize;
        }
    };

    // Get supported content types
    public query func getSupportedContentTypes() : async [Text] {
        supportedTypes
    };

    // Administrative functions

    // Add authorized uploader
    public shared(msg) func addAuthorizedUploader(principal: Principal) : async Result<(), Text> {
        // Allow the first uploader to be added by anyone when the list is empty.
        if (authorizedUploaders.size() > 0 and not isAuthorized(msg.caller)) {
            return #err("Not authorized to add uploaders");
        };

        if (isAuthorized(principal)) {
            return #err("Uploader already authorized");
        };

        let principals = Buffer.fromArray<Principal>(authorizedUploaders);
        principals.add(principal);
        authorizedUploaders := Buffer.toArray(principals);

        Debug.print("Authorized uploader added: " # Principal.toText(principal));
        #ok()
    };

    // Remove authorized uploader
    public shared(msg) func removeAuthorizedUploader(principal: Principal) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Not authorized to remove uploaders");
        };

        authorizedUploaders := Array.filter<Principal>(authorizedUploaders, func(p) = p != principal);
        
        Debug.print("Authorized uploader removed: " # Principal.toText(principal));
        #ok()
    };

    // Update storage limits
    public shared(msg) func updateStorageLimits(
        maxFileSizeNew: ?Nat,
        maxTotalStorageNew: ?Nat
    ) : async Result<(), Text> {
        if (not isAuthorized(msg.caller)) {
            return #err("Not authorized to update storage limits");
        };

        switch (maxFileSizeNew) {
            case (?size) maxFileSize := size;
            case null {};
        };

        switch (maxTotalStorageNew) {
            case (?size) {
                if (size < currentStorageUsed) {
                    return #err("New storage limit cannot be less than current usage");
                };
                maxTotalStorage := size;
            };
            case null {};
        };

        #ok()
    };

    // Get authorized uploaders
    public query func getAuthorizedUploaders() : async [Principal] {
        authorizedUploaders
    };

    // Helper functions
    private func isAuthorized(principal: Principal) : Bool {
        Array.find<Principal>(authorizedUploaders, func(p) = p == principal) != null
    };

    // Health check
    public query func health() : async { status: Text; timestamp: Time; storageUsed: Nat } {
        {
            status = "healthy";
            timestamp = Time.now();
            storageUsed = currentStorageUsed;
        }
    };

    // Get asset by name (for convenience)
    public query func getAssetByName(daoId: DaoId, name: Text) : async ?AssetMetadata {
        for ((key, asset) in assets.entries()) {
            if (Text.equal(key.daoId, daoId) and asset.name == name and asset.isPublic) {
                return ?{
                    id = asset.id;
                    daoId = asset.daoId;
                    name = asset.name;
                    contentType = asset.contentType;
                    size = asset.size;
                    uploadedBy = asset.uploadedBy;
                    uploadedAt = asset.uploadedAt;
                    isPublic = asset.isPublic;
                    tags = asset.tags;
                };
            };
        };
        null
    };

    // Batch upload assets
    public shared(_msg) func batchUploadAssets(
        daoId: DaoId,
        assets_data: [(Text, Text, AssetData, Bool, [Text])]
    ) : async [Result<AssetId, Text>] {
        let results = Buffer.Buffer<Result<AssetId, Text>>(assets_data.size());

        for ((name, contentType, data, isPublic, tags) in assets_data.vals()) {
            let result = await uploadAsset(daoId, name, contentType, data, isPublic, tags);
            results.add(result);
        };

        Buffer.toArray(results)
    };
}
