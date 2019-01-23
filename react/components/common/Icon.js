import React from 'react';
import ReactPropTypes from 'prop-types';
import { Path } from 'react-native-svg';
import SvgIcon from 'react-native-svg-icon';

const svgs = {
  profile: {
    svg: <Path fill-rule="evenodd" d="M13.683 10.999c.698-1.15 1.117-2.575 1.117-4.124C14.8 3.078 12.315 0 9.25 0 6.184 0 3.7 3.078 3.7 6.875c0 1.55.419 2.975 1.117 4.124C1.949 12.379 0 15.049 0 18.125v.625C0 19.44.552 20 1.234 20h16.033c.681 0 1.233-.56 1.233-1.25v-.625c0-3.075-1.949-5.746-4.817-7.126zM9.25 1.875c2.005 0 3.7 2.29 3.7 5s-1.694 5-3.7 5c-2.005 0-3.7-2.29-3.7-5s1.695-5 3.7-5zm-7.4 16.25c0-2.48 1.72-4.624 4.206-5.633.904.79 2.004 1.258 3.194 1.258s2.29-.468 3.194-1.258c2.486 1.008 4.206 3.152 4.206 5.633H1.85z" />,
    viewBox: '0 0 18.5 20',
  },
};

const Icon = props => <SvgIcon {...props} svgs={svgs} />;

Icon.propTypes = {
  name: ReactPropTypes.string.isRequired,
};

export default Icon;
