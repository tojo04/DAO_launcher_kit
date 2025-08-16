import Governance "./main";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Types "../shared/types";
import Result "mo:base/Result";

actor {
    public func main() : async () {
        let admin = actor {
            public func update(cfg: Types.GovernanceConfig) : async Result<(), Types.CommonError> {
                await Governance.updateConfig(cfg);
            };
        };
        let adminPrincipal = Principal.fromActor(admin);
        ignore await Governance.addAuthorizedPrincipal(adminPrincipal);

        let cfg : Types.GovernanceConfig = {
            votingPeriod = 1;
            quorumThreshold = 1;
            approvalThreshold = 51;
            proposalDeposit = 0;
            maxProposalsPerUser = 1;
        };

        let unauthorized = await Governance.updateConfig(cfg);
        assert unauthorized == #err(#notAuthorized);

        let authorized = await admin.update(cfg);
        assert authorized == #ok();

        Debug.print("governance auth test passed");
    };
}
