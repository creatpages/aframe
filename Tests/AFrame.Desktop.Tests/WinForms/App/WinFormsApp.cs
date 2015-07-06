﻿using AFrame.Core;
using AFrame.Desktop.Controls;
using AFrame.Desktop.Controls.Win;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AFrame.Desktop.Tests.WinForms.App
{
    public class WinFormsApp : WinWindow
    {
        public WinButton ClickButton { get { return this.CreateControl<WinWindow>(WinControl.PropertyNames.ControlName, "ClicksBtn").CreateControl<WinButton>(); } }

        public WinText ClickLabel { get { return this.CreateControl<WinWindow>(WinControl.PropertyNames.ControlName, "ClicksLbl").CreateControl<WinText>(); } }

        public WinFormsApp(DesktopContext context, DesktopControl parent)
            : base(context, parent)
        {
            this.SearchProperties.Add(WinControl.PropertyNames.Name, "Form1");
        }
    }
}
