﻿using AFrame.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AFrame.Desktop.Controls.Wpf
{
    public class WpfCustom : WpfControl
    {
        public WpfCustom(DesktopContext context, DesktopControl parent)
            : base(context, parent)
        {
            this.SearchProperties.Add(WpfControl.PropertyNames.ControlType, "Custom");
        }

        public new class PropertyNames : WpfControl.PropertyNames
        {

        }
    }
}