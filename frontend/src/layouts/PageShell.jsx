import AskDP from '../features/companion/AskDP.jsx';
import TabBar from './TabBar.jsx';

// The frame every signed-in page sits in.
//
// The background used to be two large, animated, heavily-saturated colour
// blobs behind every screen, and after that a still wash of the section colour
// across the top. Both are gone. The app is printed on white paper now, and a
// printed form has no light falling on it: the reading area is flat and even
// all the way up, and a section is told apart by its title and the tab that is
// inked, not by a tint in the air above it.
//
// Callers still pass `section`; it is ignored now, so none of them had to change.

// Every page used to be capped at one phone-shaped column — 672px, on any
// screen. That is the right measure for a paragraph and the wrong one for a
// page: on a 1440px laptop it left ~380px of empty ground down each side and
// turned a grid of four cards into a scroller of four cards.
//
// So the cap now grows once, at the laptop breakpoint, and only for the
// layouts that have something to put there. `narrow` deliberately does not
// grow: it is what the articles and the running check-in use, and a line of
// body text stops being readable somewhere around 75 characters no matter how
// much room is going spare.
const WIDTH = {
  default: 'max-w-2xl lg:max-w-4xl',
  wide: 'max-w-3xl lg:max-w-5xl',
  narrow: 'max-w-xl',
};

export default function PageShell({
  width = 'default',
  tabs = true,
  fit = false,
  children,
}) {
  return (
    // md:pl-60 clears the sidebar, which is fixed and so takes no space of
    // its own. Below md the nav is the bottom bar and there is nothing to
    // clear, and with `tabs` off there is no sidebar either, so the padding
    // was leaving a 15rem strip of empty ground down the left of every
    // check-in, questionnaire and signed-out article on a laptop.
    <div className={`relative min-h-screen overflow-x-hidden ${tabs ? 'md:pl-60' : ''}`}>
      {/* First thing in the document, so it is the first thing Tab reaches.
          Without it, a keyboard or switch user arriving on any page had to
          walk the masthead, the crisis button and every tab before reaching
          the content, on every navigation, on every screen. Invisible until
          focused, which is the whole trick: it costs a sighted user nothing.

          It lives here rather than in App because this is where there is
          something to skip. The five full-bleed flows that do not use this
          shell, a running practice, a questionnaire, have no navigation
          above their content, so a skip link on them would jump over nothing. */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {tabs && <TabBar />}
      {/* Same signal as the tab bar: shown where someone is browsing, hidden
          inside a flow they are partway through. */}
      {tabs && <AskDP />}

      {/* `main` is a landmark as well as the skip target — a screen reader's
          "jump to main content" command is looking for exactly this element,
          and until now the app had none on any page. tabIndex={-1} lets the
          hash move focus here without adding a stop to the tab order. */}
      <main
        id="main"
        tabIndex={-1}
        className={`lap-type mx-auto px-5 sm:px-6 ${WIDTH[width]} ${tabs ? `pad-tabbar${fit ? ' pad-fit' : ''}` : 'pb-12'} pt-6 focus:outline-none md:pt-2`}
      >
        {children}
      </main>
    </div>
  );
}
