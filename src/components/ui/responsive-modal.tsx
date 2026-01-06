"use client";

import * as React from "react";
import { useIsMobile } from "./use-mobile";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "./dialog";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "./drawer";

// ============================================
// Types
// ============================================

interface ResponsiveModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface ResponsiveModalContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface ResponsiveModalCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

// ============================================
// Context
// ============================================

const ResponsiveModalContext = React.createContext<{ isMobile: boolean }>({
  isMobile: false,
});

function useResponsiveModal() {
  return React.useContext(ResponsiveModalContext);
}

// ============================================
// Components
// ============================================

function ResponsiveModal({ children, ...props }: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveModalContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <Drawer {...props}>{children}</Drawer>
      ) : (
        <Dialog {...props}>{children}</Dialog>
      )}
    </ResponsiveModalContext.Provider>
  );
}

function ResponsiveModalTrigger({
  children,
  ...props
}: ResponsiveModalTriggerProps) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
  }

  return <DialogTrigger {...props}>{children}</DialogTrigger>;
}

function ResponsiveModalContent({
  children,
  className,
}: ResponsiveModalContentProps) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return (
      <DrawerContent className={className}>
        <div className="overflow-y-auto max-h-[85vh] px-4 pb-4">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return <DialogContent className={className}>{children}</DialogContent>;
}

function ResponsiveModalHeader({
  children,
  className,
}: ResponsiveModalHeaderProps) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>;
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

function ResponsiveModalTitle({
  children,
  className,
}: ResponsiveModalTitleProps) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

function ResponsiveModalDescription({
  children,
  className,
}: ResponsiveModalDescriptionProps) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return (
      <DrawerDescription className={className}>{children}</DrawerDescription>
    );
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
}

function ResponsiveModalFooter({
  children,
  className,
}: ResponsiveModalFooterProps) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}

function ResponsiveModalClose({
  children,
  ...props
}: ResponsiveModalCloseProps) {
  const { isMobile } = useResponsiveModal();

  if (isMobile) {
    return <DrawerClose {...props}>{children}</DrawerClose>;
  }

  return <DialogClose {...props}>{children}</DialogClose>;
}

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalClose,
  useResponsiveModal,
};
