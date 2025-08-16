import Treasury "./main";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Types "../shared/types";
import Result "mo:base/Result";

actor {
    public func main() : async () {
        let admin = actor {
            public func add(p: Principal) : async Result<(), Types.CommonError> {
                await Treasury.addAuthorizedPrincipal(p);
            };
        };
        let adminPrincipal = Principal.fromActor(admin);
        ignore await Treasury.addAuthorizedPrincipal(adminPrincipal);

        let unauthorizedAdd = await Treasury.addAuthorizedPrincipal(Principal.fromActor(this));
        assert unauthorizedAdd == #err(#notAuthorized);

        let unauthorizedRemove = await Treasury.removeAuthorizedPrincipal(adminPrincipal);
        assert unauthorizedRemove == #err(#notAuthorized);

        let addRes = await admin.add(Principal.fromActor(this));
        assert addRes == #ok();

        Debug.print("treasury auth test passed");
    };
}
