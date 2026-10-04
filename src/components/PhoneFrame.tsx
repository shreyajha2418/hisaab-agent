import type { ReactNode } from 'react';
import styled from 'styled-components';

// Mobile-first: on an actual phone viewport this is just the page (no
// chrome). On a wider (desktop) viewport, it's centered and dressed up
// as a phone — for screen-recording the demo.
const Backdrop = styled.div`
  min-height: 100svh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0b0b0d;

  @media (max-width: 480px) {
    display: block;
    background: transparent;
  }
`;

const Frame = styled.div`
  width: 390px;
  height: 844px;
  border-radius: 44px;
  border: 10px solid #1c1c1f;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  position: relative;
  background: #fff;

  @media (max-width: 480px) {
    width: 100%;
    height: 100svh;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
`;

const Notch = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 24px;
  background: #1c1c1f;
  border-radius: 0 0 16px 16px;
  z-index: 10;

  @media (max-width: 480px) {
    display: none;
  }
`;

const Screen = styled.div`
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <Backdrop>
      <Frame>
        <Notch />
        <Screen>{children}</Screen>
      </Frame>
    </Backdrop>
  );
}
