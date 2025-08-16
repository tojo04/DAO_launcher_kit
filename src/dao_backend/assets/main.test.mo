import Asset "./main";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Types "../shared/types";
import Result "mo:base/Result";

// Simple runtime test that verifies the first call to `addAuthorizedUploader`
// succeeds even when no uploader has been configured yet.
actor {
    public func main() : async () {
        let myPrincipal = Principal.fromActor(this);
        let res = await Asset.addAuthorizedUploader(myPrincipal);
        assert res == #ok();

        let uploaders = await Asset.getAuthorizedUploaders();
        assert Array.find<Principal>(uploaders, func(p) = p == myPrincipal) != null;

        let unauthorized = actor {
            public func tryAdd(p: Principal) : async Result<(), Types.CommonError> {
                await Asset.addAuthorizedUploader(p);
            }
        };
        let unauthorizedRes = await unauthorized.tryAdd(myPrincipal);
        assert unauthorizedRes == #err(#notAuthorized);

        let duplicateRes = await Asset.addAuthorizedUploader(myPrincipal);
        assert duplicateRes == #err(#alreadyExists);

        Debug.print("initial uploader configuration test passed");
    };
}

