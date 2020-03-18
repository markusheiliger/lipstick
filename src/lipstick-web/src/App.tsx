// import * as React from 'react';
import React from 'react';
import './App.css';
import {
  BrowserRouter,
  Switch,
  Route,
  useParams
} from "react-router-dom";


import { initializeIcons } from '@uifabric/icons';
import { HomeView } from './views/HomeView';
import { LabView } from './views/LabView';
import { Error404 } from './views/Error404';
import { HeaderBar } from './components/HeaderBar';

interface IAppState {
  
}

interface IAppProps {
  onSignOut:() => void;
  tenantId: string;
}

class App extends React.Component<IAppProps, IAppState> {

  constructor(props) {
    super(props);
    initializeIcons();
  }

  render () {
  
    return (
      <div>
        <BrowserRouter>
          <Switch>
            <Route  path="/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Microsoft.DevTestLab/labs/:resourceName">
              <LabViewWrapper {...this.props} />
            </Route>
            <Route  path="/subscriptions/:subscriptionId">
              <HomeViewWrapper {...this.props} />
            </Route>
            <Route  path="/" exact={true}>
              <HomeViewWrapper {...this.props} />
            </Route>
            <Route  path="*">
              <Error404Wrapper {...this.props} />
            </Route>
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

function HeaderBarWrapper(props: IAppProps) {
  return <header>
    <HeaderBar onSignOut={props.onSignOut} tenantId={props.tenantId} />
  </header>;
}

function LabViewWrapper(props: IAppProps) {
  let { subscriptionId, resourceGroup, resourceName } = useParams();
  return <>
    <HeaderBarWrapper {...props} />
    <LabView 
        labId={'/subscriptions/' + subscriptionId + '/resourceGroups/' + resourceGroup + '/providers/Microsoft.DevTestLab/labs/' + resourceName} 
        tenantId={props.tenantId}
    />
  </>;
}

function HomeViewWrapper(props: IAppProps) {
  let { subscriptionId } = useParams();
  return <>
    <HeaderBarWrapper {...props} />
    <HomeView tenantId={props.tenantId} subscriptionId={subscriptionId} />
  </>;
}

function Error404Wrapper(props: IAppProps) {
  return <>
    <HeaderBarWrapper {...props} />
    <Error404 />
  </>;
}

export default App;
