import { Component } from "react";
import { withTranslation } from "react-i18next";
import { AiError } from "./AiStates";

class AiErrorBoundaryBase extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("AI view failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AiError
          message={this.props.t("ai.errors.render")}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}

export default withTranslation()(AiErrorBoundaryBase);