import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <div className="justify-content-center jimu-primary-loading" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    position: relative;
    width: 20px;
    height: 20px;
  }

  .jimu-primary-loading:before,
  .jimu-primary-loading:after {
    position: absolute;
    top: 0;
    content: '';
  }

  .jimu-primary-loading:before {
    left: -4px;
  }

  .jimu-primary-loading:after {
    left: 4px;
    -webkit-animation-delay: 0.32s !important;
    animation-delay: 0.32s !important;
  }

  .jimu-primary-loading:before,
  .jimu-primary-loading:after,
  .jimu-primary-loading {
    background: #076fe5;
    -webkit-animation: loading-keys-app-loading 0.8s infinite ease-in-out;
    animation: loading-keys-app-loading 0.8s infinite ease-in-out;
    width: 3px;
    height: 8px;
  }

  .jimu-primary-loading {
    text-indent: -9999em;
    margin: auto;
    position: absolute;
    right: calc(50% - 1.5px);
    top: calc(50% - 4px);
    -webkit-animation-delay: 0.16s !important;
    animation-delay: 0.16s !important;
  }

  @-webkit-keyframes loading-keys-app-loading {
    0%,
    80%,
    100% {
      opacity: .75;
      box-shadow: 0 0 #076fe5;
      height: 8px;
    }

    40% {
      opacity: 1;
      box-shadow: 0 -2px #076fe5;
      height: 10px;
    }
  }

  @keyframes loading-keys-app-loading {
    0%,
    80%,
    100% {
      opacity: .75;
      box-shadow: 0 0 #076fe5;
      height: 8px;
    }

    40% {
      opacity: 1;
      box-shadow: 0 -2px #076fe5;
      height: 10px;
    }
  }`;

export default Loader;
