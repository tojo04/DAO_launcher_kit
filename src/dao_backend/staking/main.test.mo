import Staking "./main";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Types "../shared/types";
import Result "mo:base/Result";

actor {
    public func main() : async () {
        let admin = actor {
            public func enable() : async Result<(), Types.CommonError> {
                await Staking.setStakingEnabled(true);
            };
        };
        let adminPrincipal = Principal.fromActor(admin);
        ignore await Staking.addAuthorizedPrincipal(adminPrincipal);

        let unauthorized = await Staking.setStakingEnabled(false);
        assert unauthorized == #err(#notAuthorized);

        let authorized = await admin.enable();
        assert authorized == #ok();

        Debug.print("staking auth test passed");
    };
}
