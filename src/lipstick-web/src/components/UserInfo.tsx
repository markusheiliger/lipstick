import React from "react";
import { Persona, PersonaSize } from "office-ui-fabric-react/lib/Persona";
import { User, fetchUser } from "../models/User";
import { Panel } from 'office-ui-fabric-react/lib/Panel';
import { DefaultButton, Stack } from 'office-ui-fabric-react';
import './UserInfo.css'; 
import { Tenant, fetchTenant } from "../models/Tenant";

export interface IUserInfoProps {
  onSignOut:() => void;
  tenantId: string;
}

export interface IUserInfoState {
  initialized: boolean;
  user: User;
  tenant: Tenant;
  panelVisible:boolean;
}

export class UserInfo extends React.Component<IUserInfoProps, IUserInfoState> {

    constructor(props:any) {
        super(props);
        this.state = this._getDefaultState();
    }

    private _getDefaultState(): IUserInfoState {      
      return {
        initialized: false,
        user: {} as User,
        tenant: {} as Tenant,
        panelVisible: false
      };
    }

    async componentDidMount() {

      var promises:any[] = [
        fetchUser(),
        fetchTenant(this.props.tenantId)
      ]

      var results = await Promise.all(promises);

      this.setState({
        initialized: true,
        user: results[0] ,
        tenant: results[1]
      });
    }

    render() {

      if (this.state.initialized) {

        return <div className="user">
          <Persona
            text={this.state.user.displayName} 
            secondaryText={this.state.tenant.displayName || this.props.tenantId}
            size={PersonaSize.size40}
            onClick={this._showPanel}
          />
          <Panel isLightDismiss isOpen={this.state.panelVisible} onDismiss={this._hidePanel} className="userPanel">
            <Stack>
              <DefaultButton text="sign out" onClick={this._signOut} />
            </Stack>
          </Panel>
        </div>;

      } else {

        return <></>;

      }
    }

    private _hidePanel = () => {
      this.setState({panelVisible: false});
    }

    private _showPanel = () => {
      this.setState({panelVisible: true});
    }

    private _signOut = () => {
      this.props.onSignOut();
    }
  }